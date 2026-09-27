import "server-only";

import { init, Organizations } from "@kinde/management-api-js";
import { env } from "@/lib/env";

let cachedDefaultOrgCode: string | null | undefined;

/**
 * Resolves the code of Kinde's default organization, which always exists and cannot be deleted.
 * It is excluded from the app so it never renders as a usable workspace.
 */
export async function getDefaultOrgCode(): Promise<string | null> {
  if (cachedDefaultOrgCode !== undefined) {
    return cachedDefaultOrgCode;
  }

  if (env.KINDE_DEFAULT_ORG_CODE) {
    cachedDefaultOrgCode = env.KINDE_DEFAULT_ORG_CODE;
    return cachedDefaultOrgCode;
  }

  try {
    init();

    let nextToken: string | null | undefined;

    do {
      const data = await Organizations.getOrganizations({ pageSize: 100, nextToken });

      const defaultOrg = data.organizations?.find((organization) => organization.is_default);

      if (defaultOrg?.code) {
        cachedDefaultOrgCode = defaultOrg.code;
        return cachedDefaultOrgCode;
      }

      nextToken = data.next_token ?? null;
    } while (nextToken);

    cachedDefaultOrgCode = null;
  } catch {
    cachedDefaultOrgCode = null;
  }

  return cachedDefaultOrgCode;
}
