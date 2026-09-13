import { KindeOrganization } from "@kinde-oss/kinde-auth-nextjs";
import { base } from "./base";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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
