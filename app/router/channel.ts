import { z } from "zod";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import {
  findWorkspaceMember,
  getWorkspaceMembers,
  requiredWorkspaceAdminMiddleware,
  requiredWorspaceMiddleware,
} from "../middlewares/workspace";
import {
  addChannelMemberSchema,
  channelIdSchema,
  channelNameSchema,
  removeChannelMemberSchema,
  updateChannelMembersSchema,
  updateChannelSchema,
} from "../schemas/channel";
import { prisma } from "@/lib/prisma";
import { Channel } from "@/lib/generated/prisma/client";
import { organization_user } from "@kinde/management-api-js";
import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";
import { isWorkspaceAdmin } from "../schemas/member";

const channelWithMembers = z.custom<Channel & { members: { userId: string }[] }>();

function uniqueViolation(error: unknown) {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002"
  );
}

async function loadChannel(channelId: string, workspaceId: string) {
  return prisma.channel.findUnique({
    where: { id: channelId, workspaceId },
    select: { id: true, name: true, createdById: true },
  });
}

async function assertChannelAccess({
  channelId,
  workspaceId,
  userId,
  members,
}: {
  channelId: string;
  workspaceId: string;
  userId: string;
  members: organization_user[];
}) {
  const channel = await loadChannel(channelId, workspaceId);

  if (!channel) {
    return { channel: null, isAdmin: false, isMember: false };
  }

  const isAdmin = isWorkspaceAdmin(findWorkspaceMember(members, userId)?.roles);
  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
    select: { id: true },
  });

  return { channel, isAdmin, isMember: Boolean(membership) };
}

export const createChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceAdminMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channel",
    summary: "Create Channel",
    description: "Create a new private channel. Only workspace admins can create channels.",
    tags: ["Channel"],
  })
  .input(channelNameSchema)
  .output(z.custom<Channel>())
  .handler(async ({ context, input, errors }) => {
    try {
      const channel = await prisma.channel.create({
        data: {
          name: input.name,
          workspaceId: context.workspace.orgCode,
          createdById: context.user.id,
          members: {
            create: { userId: context.user.id },
          },
        },
      });

      return channel;
    } catch (error) {
      if (uniqueViolation(error)) {
        throw errors.BAD_REQUEST({ message: "A channel with this name already exists." });
      }

      throw errors.INTERNAL_SERVER_ERROR();
    }
  });

export const listChannels = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .route({
    method: "GET",
    path: "/channels",
    summary: "List Channels",
    description: "List channels the authenticated user can access in their workspace.",
    tags: ["Channel"],
  })
  .input(z.void())
  .output(
    z.object({
      channels: z.array(channelWithMembers),
      currentWorkspace: z.custom<KindeOrganization<unknown>>(),
      members: z.array(z.custom<organization_user>()),
      isAdmin: z.boolean(),
    })
  )
  .handler(async ({ context }) => {
    const [members] = await Promise.all([getWorkspaceMembers(context.workspace.orgCode)]);

    const isAdmin = isWorkspaceAdmin(findWorkspaceMember(members, context.user.id)?.roles);

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId: context.workspace.orgCode,
        // Admins see every channel; members only see the ones they belong to.
        ...(isAdmin ? {} : { members: { some: { userId: context.user.id } } }),
      },
      orderBy: { createdAt: "desc" },
      include: { members: { select: { userId: true } } },
    });

    return {
      channels,
      members,
      isAdmin,
      currentWorkspace: context.workspace,
    };
  });

export const getChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/channels/:channelId",
    summary: "Get Channel",
    description: "Get a channel by its ID.",
    tags: ["channels"],
  })
  .input(channelIdSchema)
  .output(
    z.object({
      channelName: z.string(),
      currentUser: z.custom<KindeUser<Record<string, unknown>>>(),
      isAdmin: z.boolean(),
      isMember: z.boolean(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    let members: organization_user[];

    try {
      members = await getWorkspaceMembers(context.workspace.orgCode);
    } catch (error) {
      console.error("[getChannel] failed to load members", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    const { channel, isAdmin, isMember } = await assertChannelAccess({
      channelId: input.channelId,
      workspaceId: context.workspace.orgCode,
      userId: context.user.id,
      members,
    });

    if (!channel || (!isAdmin && !isMember)) {
      throw errors.NOT_FOUND();
    }

    return {
      channelName: channel.name,
      currentUser: context.user,
      isAdmin,
      isMember,
    };
  });

export const updateChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceAdminMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "PUT",
    path: "/channels/:channelId",
    summary: "Update Channel",
    description: "Rename a channel. Only workspace admins can update channels.",
    tags: ["Channel"],
  })
  .input(updateChannelSchema)
  .output(z.custom<Channel>())
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    try {
      return await prisma.channel.update({
        where: { id: input.channelId },
        data: { name: input.name },
      });
    } catch (error) {
      if (uniqueViolation(error)) {
        throw errors.BAD_REQUEST({ message: "A channel with this name already exists." });
      }

      throw errors.INTERNAL_SERVER_ERROR();
    }
  });

export const deleteChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceAdminMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "DELETE",
    path: "/channels/:channelId",
    summary: "Delete Channel",
    description: "Delete a channel and all of its messages. Only workspace admins can delete channels.",
    tags: ["Channel"],
  })
  .input(channelIdSchema)
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    // Messages and channel members cascade via the schema relations.
    await prisma.channel.delete({ where: { id: input.channelId } });
  });

export const listChannelMembers = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/channels/:channelId/members",
    summary: "List Channel Members",
    tags: ["Channel"],
  })
  .input(channelIdSchema)
  .output(z.array(z.string()))
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    const memberRows = await prisma.channelMember.findMany({
      where: { channelId: input.channelId },
      select: { userId: true },
    });

    return memberRows.map((row) => row.userId);
  });

export const updateChannelMembers = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceAdminMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channels/:channelId/members",
    summary: "Update Channel Members",
    description: "Replace the set of members that can access a channel. Only workspace admins can do this.",
    tags: ["Channel"],
  })
  .input(updateChannelMembersSchema)
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    let members: organization_user[];

    try {
      members = await getWorkspaceMembers(context.workspace.orgCode);
    } catch (error) {
      console.error("[updateChannelMembers] failed to load members", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    const workspaceUserIds = new Set(members.map((member) => member.id).filter(Boolean));
    const targetUserIds = new Set(input.userIds.filter((userId) => workspaceUserIds.has(userId)));

    // The channel creator always keeps access.
    targetUserIds.add(channel.createdById);

    await prisma.$transaction([
      prisma.channelMember.deleteMany({
        where: { channelId: input.channelId, userId: { notIn: [...targetUserIds] } },
      }),
      prisma.channelMember.createMany({
        data: [...targetUserIds].map((userId) => ({ channelId: input.channelId, userId })),
        skipDuplicates: true,
      }),
    ]);
  });

export const addChannelMember = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceAdminMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channels/:channelId/members/add",
    summary: "Add Channel Member",
    tags: ["Channel"],
  })
  .input(addChannelMemberSchema)
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    const members = await getWorkspaceMembers(context.workspace.orgCode);

    if (!findWorkspaceMember(members, input.userId)) {
      throw errors.BAD_REQUEST({ message: "This person is not a member of the workspace." });
    }

    await prisma.channelMember.createMany({
      data: [{ channelId: input.channelId, userId: input.userId }],
      skipDuplicates: true,
    });
  });

export const removeChannelMember = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceAdminMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channels/:channelId/members/remove",
    summary: "Remove Channel Member",
    tags: ["Channel"],
  })
  .input(removeChannelMemberSchema)
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    if (input.userId === channel.createdById) {
      throw errors.BAD_REQUEST({ message: "The channel creator cannot be removed from the channel." });
    }

    await prisma.channelMember.deleteMany({
      where: { channelId: input.channelId, userId: input.userId },
    });
  });

export const leaveChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channels/:channelId/leave",
    summary: "Leave Channel",
    tags: ["Channel"],
  })
  .input(channelIdSchema)
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    const channel = await loadChannel(input.channelId, context.workspace.orgCode);

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    const members = await getWorkspaceMembers(context.workspace.orgCode);

    if (isWorkspaceAdmin(findWorkspaceMember(members, context.user.id)?.roles)) {
      throw errors.BAD_REQUEST({ message: "Admins always have access to every channel and cannot leave one." });
    }

    if (input.channelId === channel.createdById) {
      throw errors.BAD_REQUEST({ message: "The channel creator cannot leave the channel." });
    }

    await prisma.channelMember.deleteMany({
      where: { channelId: input.channelId, userId: context.user.id },
    });
  });
