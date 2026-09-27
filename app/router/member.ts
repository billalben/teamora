import z from "zod";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorspaceMiddleware } from "../middlewares/workspace";
import {
  inviteMemberSchema,
  isWorkspaceAdmin,
  memberActivityListSchema,
  removeMemberSchema,
  workspaceActivitySchema,
  WorkspaceActivityType,
} from "../schemas/member";
import { ApiError, init, organization_user, Organizations, Users } from "@kinde/management-api-js";
import { prisma } from "@/lib/prisma";
import { getAvatar } from "@/lib/getAvatar";

async function getWorkspaceMembers(orgCode: string) {
  const { organization_users } = await Organizations.getOrganizationUsers({
    orgCode,
    sort: "name_asc",
  });

  return organization_users ?? [];
}

type RemovalFailure = "forbidden" | "notFound" | "unknown";

/**
 * Remove a user from a Kinde organization. Returns a failure kind instead of
 * throwing so every handler can map it to its own typed error.
 */
async function removeOrganizationMember(orgCode: string, userId: string): Promise<RemovalFailure | null> {
  try {
    await Organizations.removeOrganizationUser({ orgCode, userId });

    return null;
  } catch (error) {
    console.error("[member] failed to remove organization user", error);

    if (error instanceof ApiError) {
      if (error.status === 403) {
        return "forbidden";
      }

      if (error.status === 404) {
        return "notFound";
      }
    }

    return "unknown";
  }
}

export const inviteMember = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace/members/invite",
    summary: "Invite Member",
    tags: ["Member"],
  })
  .input(inviteMemberSchema)
  .output(z.object({ userId: z.string() }))
  .handler(async ({ input, context, errors }) => {
    init();

    let user;

    try {
      const { users } = await Users.getUsers({ email: input.email });
      user = users?.[0];
    } catch (error) {
      console.error("[inviteMember] failed to look up user", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    if (!user?.id) {
      throw errors.NOT_FOUND({ message: "No account found with this email. They need to sign up first." });
    }

    if (user.id === context.user.id) {
      throw errors.BAD_REQUEST({ message: "You're already a member of this workspace." });
    }

    let isAlreadyMember = false;

    try {
      const members = await getWorkspaceMembers(context.workspace.orgCode);
      isAlreadyMember = members.some((member) => member.id === user.id);
    } catch (error) {
      console.error("[inviteMember] failed to load members", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    // `addOrganizationUsers` is idempotent, so guard against re-adding someone
    // who already belongs to the workspace (which would also log a false join).
    if (isAlreadyMember) {
      throw errors.BAD_REQUEST({ message: "This person is already a member of the workspace." });
    }

    try {
      await Organizations.addOrganizationUsers({
        orgCode: context.workspace.orgCode,
        requestBody: {
          users: [{ id: user.id }],
        },
      });
    } catch (error) {
      console.error("[inviteMember] failed to add member", error);

      if (error instanceof ApiError) {
        if (error.status === 403) {
          throw errors.FORBIDDEN({ message: "The server is missing permission to invite members." });
        }

        if (error.status === 400 || error.status === 409) {
          throw errors.BAD_REQUEST({ message: "This person is already a member of the workspace." });
        }
      }

      throw errors.INTERNAL_SERVER_ERROR();
    }

    const invitedEmail = user.email ?? input.email;

    try {
      await prisma.workspaceActivity.create({
        data: {
          type: WorkspaceActivityType.MemberJoined,
          workspaceId: context.workspace.orgCode,
          actorId: context.user.id,
          actorEmail: context.user.email ?? null,
          actorName: context.user.given_name ?? context.user.email ?? null,
          actorAvatarUrl: getAvatar({ email: context.user.email, picture: context.user.picture }),
          targetId: user.id,
          targetEmail: invitedEmail,
          targetName: [user.first_name, user.last_name].filter(Boolean).join(" ") || invitedEmail,
          targetAvatarUrl: getAvatar({ email: invitedEmail, picture: user.picture }),
        },
      });
    } catch (error) {
      // The member was added successfully; failing to record the activity
      // should not surface as an error to the caller.
      console.error("[inviteMember] failed to record activity", error);
    }

    return { userId: user.id };
  });

export const removeMember = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace/members/remove",
    summary: "Remove Member",
    tags: ["Member"],
  })
  .input(removeMemberSchema)
  .output(z.void())
  .handler(async ({ input, context, errors }) => {
    init();

    const orgCode = context.workspace.orgCode;

    let members;

    try {
      members = await getWorkspaceMembers(orgCode);
    } catch (error) {
      console.error("[removeMember] failed to load members", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    const actor = members.find((member) => member.id === context.user.id);
    const target = members.find((member) => member.id === input.userId);

    if (!target) {
      throw errors.NOT_FOUND({ message: "This person is not a member of the workspace." });
    }

    if (isWorkspaceAdmin(target.roles) && members.filter((member) => isWorkspaceAdmin(member.roles)).length <= 1) {
      throw errors.BAD_REQUEST({ message: "The workspace must keep at least one admin." });
    }

    // Removing yourself is equivalent to leaving; only you can do that.
    if (input.userId === context.user.id) {
      const failure = await removeOrganizationMember(orgCode, input.userId);

      if (failure === "forbidden") {
        throw errors.FORBIDDEN({ message: "The server is missing permission to manage members." });
      }

      if (failure === "unknown") {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      await prisma.workspaceActivity.create({
        data: {
          type: WorkspaceActivityType.MemberLeft,
          workspaceId: orgCode,
          targetId: target.id ?? input.userId,
          targetEmail: target.email ?? null,
          targetName: target.full_name ?? target.email ?? null,
          targetAvatarUrl: getAvatar({ email: target.email, picture: target.picture }),
        },
      });

      return;
    }

    if (!isWorkspaceAdmin(actor?.roles)) {
      throw errors.FORBIDDEN({ message: "Only workspace admins can remove members." });
    }

    const failure = await removeOrganizationMember(orgCode, input.userId);

    if (failure === "forbidden") {
      throw errors.FORBIDDEN({ message: "The server is missing permission to manage members." });
    }

    if (failure === "notFound") {
      throw errors.NOT_FOUND({ message: "This person is no longer a member of the workspace." });
    }

    if (failure === "unknown") {
      throw errors.INTERNAL_SERVER_ERROR();
    }

    await prisma.workspaceActivity.create({
      data: {
        type: WorkspaceActivityType.MemberRemoved,
        workspaceId: orgCode,
        actorId: actor?.id ?? context.user.id,
        actorEmail: actor?.email ?? context.user.email ?? null,
        actorName: actor?.full_name ?? context.user.given_name ?? context.user.email ?? null,
        actorAvatarUrl: getAvatar({
          email: actor?.email ?? context.user.email,
          picture: actor?.picture ?? context.user.picture,
        }),
        targetId: target.id ?? input.userId,
        targetEmail: target.email ?? null,
        targetName: target.full_name ?? target.email ?? null,
        targetAvatarUrl: getAvatar({ email: target.email, picture: target.picture }),
      },
    });
  });

export const leaveWorkspace = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace/members/leave",
    summary: "Leave Workspace",
    tags: ["Member"],
  })
  .input(z.void())
  .output(z.void())
  .handler(async ({ context, errors }) => {
    init();

    const orgCode = context.workspace.orgCode;

    let members;

    try {
      members = await getWorkspaceMembers(orgCode);
    } catch (error) {
      console.error("[leaveWorkspace] failed to load members", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    const self = members.find((member) => member.id === context.user.id);

    if (!self?.id) {
      throw errors.NOT_FOUND({ message: "You are not a member of this workspace." });
    }

    if (isWorkspaceAdmin(self.roles) && members.filter((member) => isWorkspaceAdmin(member.roles)).length <= 1) {
      throw errors.BAD_REQUEST({
        message: "You're the only admin. Assign another admin before leaving this workspace.",
      });
    }

    const failure = await removeOrganizationMember(orgCode, self.id);

    if (failure === "forbidden") {
      throw errors.FORBIDDEN({ message: "The server is missing permission to manage members." });
    }

    if (failure === "unknown") {
      throw errors.INTERNAL_SERVER_ERROR();
    }

    await prisma.workspaceActivity.create({
      data: {
        type: WorkspaceActivityType.MemberLeft,
        workspaceId: orgCode,
        targetId: self.id,
        targetEmail: self.email ?? null,
        targetName: self.full_name ?? self.email ?? null,
        targetAvatarUrl: getAvatar({ email: self.email, picture: self.picture }),
      },
    });
  });

export const listActivity = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .route({
    method: "GET",
    path: "/workspace/members/activity",
    summary: "List Workspace Activity",
    tags: ["Member"],
  })
  .input(memberActivityListSchema)
  .output(z.array(workspaceActivitySchema))
  .handler(async ({ input, context }) => {
    return prisma.workspaceActivity.findMany({
      where: { workspaceId: context.workspace.orgCode },
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });
  });

export const listMembers = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "GET",
    path: "/workspace/members",
    summary: "List All Members",
    tags: ["Members"],
  })
  .input(z.void())
  .output(z.array(z.custom<organization_user>()))
  .handler(async ({ context, errors }) => {
    try {
      init();

      const data = await Organizations.getOrganizationUsers({
        orgCode: context.workspace.orgCode,
        sort: "name_asc",
      });

      if (!data.organization_users) {
        throw errors.NOT_FOUND();
      }

      return data.organization_users;
    } catch {
      throw errors.INTERNAL_SERVER_ERROR();
    }
  });
