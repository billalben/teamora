import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { base } from "./base";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { init, organization_user, Organizations } from "@kinde/management-api-js";
import { isWorkspaceAdmin } from "../schemas/member";

export const requiredWorspaceMiddleware = base
  .$context<{ workspace?: KindeOrganization<unknown | null> }>()
  .middleware(async ({ context, next, errors }) => {
    const workspace = context.workspace ?? (await getWorkspace());

    if (!workspace) {
      throw errors.FORBIDDEN();
    }

    return next({
      context: { workspace },
    });
  });

async function getWorkspace() {
  const { getOrganization } = getKindeServerSession();

  const organization = await getOrganization();

  return organization;
}

export async function getWorkspaceMembers(orgCode: string): Promise<organization_user[]> {
  init();

  const { organization_users } = await Organizations.getOrganizationUsers({
    orgCode,
    sort: "name_asc",
  });

  return organization_users ?? [];
}

export function findWorkspaceMember(members: organization_user[], userId: string) {
  return members.find((member) => member.id === userId);
}

/**
 * Requires the authenticated user to be an admin (or owner) of the active
 * workspace. Must be used after `requiredAuthMiddleware`. Resolves the
 * workspace itself and forwards it on the context.
 */
export const requiredWorkspaceAdminMiddleware = base
  .$context<{
    workspace?: KindeOrganization<unknown | null>;
    user?: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const workspace = context.workspace ?? (await getWorkspace());

    if (!workspace || !context.user) {
      throw errors.FORBIDDEN();
    }

    let members: organization_user[];

    try {
      members = await getWorkspaceMembers(workspace.orgCode);
    } catch (error) {
      console.error("[workspace-admin] failed to load members", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }

    const member = findWorkspaceMember(members, context.user.id);

    if (!isWorkspaceAdmin(member?.roles)) {
      throw errors.FORBIDDEN({ message: "Only workspace admins can perform this action." });
    }

    return next({ context: { workspace } });
  });
