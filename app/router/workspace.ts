import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod";
import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { workspaceSchema } from "../schemas/workspace";
import { getDefaultOrgCode } from "@/lib/default-org";
import { init, Organizations, Users } from "@kinde/management-api-js";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";

type WorkspaceSummary = { id: string; name: string; avatar?: string };

function toWorkspace(code: string, name?: string | null): WorkspaceSummary {
  const resolvedName = name?.trim() || "Unnamed Workspace";

  return {
    id: code,
    name: resolvedName,
    avatar: resolvedName.charAt(0).toUpperCase(),
  };
}

function sortWorkspaces(workspaces: WorkspaceSummary[]) {
  return workspaces.sort(
    (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id)
  );
}

/**
 * Resolve the user's organizations. Membership is read live from the Kinde
 * Management API so a workspace someone was just added to shows up without
 * having to log out and back in (token claims are only re-minted on login).
 * Falls back to the ID-token claims if the API call fails.
 */
async function resolveUserWorkspaces({
  userId,
  fallbackOrgs,
}: {
  userId: string;
  fallbackOrgs: { code: string; name?: string | null }[];
}): Promise<WorkspaceSummary[]> {
  const nameByCode = new Map(fallbackOrgs.map((org) => [org.code, org.name]));

  try {
    init();

    const [{ users }, organizationsResponse] = await Promise.all([
      Users.getUsers({ userId, expand: "organizations" }),
      Organizations.getOrganizations(),
    ]);

    const organizations = users?.[0]?.organizations;

    // The users endpoint only returns organization codes, so pull the names
    // from the organizations list to keep them in sync (including orgs the
    // user joined before their token was refreshed).
    for (const organization of organizationsResponse.organizations ?? []) {
      if (organization.code) {
        nameByCode.set(organization.code, organization.name);
      }
    }

    if (organizations?.length) {
      return organizations.map((code) => toWorkspace(code, nameByCode.get(code)));
    }
  } catch (error) {
    console.error("[listWorkspaces] failed to load organizations from the management API", error);
  }

  return fallbackOrgs.map((org) => toWorkspace(org.code, org.name));
}

export const listWorkspaces = base
  .use(requiredAuthMiddleware)
  .route({
    method: "GET",
    path: "/workspace",
    summary: "List Workspaces",
    description: "Retrieve a list of workspaces for the authenticated user.",
    tags: ["Workspace"],
  })
  .input(z.void())
  .output(
    z.object({
      workspaces: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          avatar: z.string().optional(),
        })
      ),
      user: z.custom<KindeUser<Record<string, unknown>>>(),
      currentWorkspace: z.custom<KindeOrganization<unknown>>().nullable(),
    })
  )
  .handler(async ({ context, errors }) => {
    const { getUserOrganizations, getOrganization } = getKindeServerSession();

    const [organizations, organization, defaultOrgCode] = await Promise.all([
      getUserOrganizations(),
      getOrganization(),
      getDefaultOrgCode(),
    ]);

    if (!organizations) {
      throw errors.FORBIDDEN();
    }

    const resolved = await resolveUserWorkspaces({
      userId: context.user.id,
      fallbackOrgs: organizations.orgs,
    });

    // Keep a stable, predictable order across workspace switches.
    // The Kinde default organization is intentionally hidden.
    const workspaces = sortWorkspaces(resolved.filter((workspace) => workspace.id !== defaultOrgCode));

    const activeOrgCode = organization?.orgCode;
    // The active org may not be among the memberships yet (e.g. still settling
    // after a switch), so only surface it when it is actually listed.
    const currentWorkspace =
      organization && activeOrgCode !== defaultOrgCode && workspaces.some((workspace) => workspace.id === activeOrgCode)
        ? organization
        : null;

    return {
      workspaces,
      user: context.user,
      currentWorkspace,
    };
  });

export const createWorkspaces = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace",
    summary: "Create Workspace",
    description: "Create a new workspace for the authenticated user.",
    tags: ["Workspace"],
  })
  .input(workspaceSchema)
  .output(
    z.object({
      orgCode: z.string(),
      workspaceName: z.string(),
    })
  )
  .handler(async ({ context, errors, input }) => {
    init();

    let data;

    try {
      data = await Organizations.createOrganization({
        requestBody: {
          name: input.name,
          // Do not let anyone auto-join this workspace by supplying its org_code.
          is_allow_registrations: false,
        },
      });
    } catch {
      throw errors.FORBIDDEN();
    }

    if (!data.organization?.code) {
      throw errors.FORBIDDEN();
    }

    try {
      await Organizations.addOrganizationUsers({
        orgCode: data.organization?.code,
        requestBody: {
          users: [
            {
              id: context.user.id,
              roles: ["admin"],
            },
          ],
        },
      });
    } catch {
      throw errors.FORBIDDEN();
    }

    return {
      orgCode: data.organization.code,
      workspaceName: input.name,
    };
  });
