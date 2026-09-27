import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod";
import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { workspaceSchema } from "../schemas/workspace";
import { getDefaultOrgCode } from "@/lib/default-org";
import { init, Organizations } from "@kinde/management-api-js";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";

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

    return {
      // Keep a stable, predictable order across workspace switches.
      // The Kinde default organization is intentionally hidden.
      workspaces: [...organizations.orgs]
        .filter((org) => org.code !== defaultOrgCode)
        .map((org) => ({
          id: org.code,
          name: org.name ?? "Unnamed Workspace",
          avatar: org.name?.charAt(0).toUpperCase() ?? "U",
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id)),
      user: context.user,
      // May be null while the active organization is still settling (e.g. right after a switch).
      currentWorkspace: organization && organization.orgCode !== defaultOrgCode ? organization : null,
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
