import z from "zod";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorspaceMiddleware } from "../middlewares/workspace";
import { channelNameSchema } from "../schemas/channel";
import { prisma } from "@/lib/prisma";
import { Channel } from "@/lib/generated/prisma/client";
import { init, organization_user, Organizations } from "@kinde/management-api-js";
import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";

export const createChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channel",
    summary: "Create Channel",
    description: "Create a new channel for the authenticated user.",
    tags: ["Channel"],
  })
  .input(channelNameSchema)
  .output(z.custom<Channel>())
  .handler(async ({ context, input }) => {
    const channel = await prisma.channel.create({
      data: {
        name: input.name,
        workspaceId: context.workspace.orgCode,
        createdById: context.user.id,
      },
    });

    return channel;
  });

export const listChannels = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .route({
    method: "GET",
    path: "/channels",
    summary: "List Channels",
    description: "List all channels for the authenticated user's workspace.",
    tags: ["Channel"],
  })
  .input(z.void())
  .output(
    z.object({
      channels: z.array(z.custom<Channel>()),
      currentWorkspace: z.custom<KindeOrganization<unknown>>(),
      members: z.array(z.custom<organization_user>()),
    })
  )
  .handler(async ({ context }) => {
    const [channels, members] = await Promise.all([
      prisma.channel.findMany({
        where: {
          workspaceId: context.workspace.orgCode,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // Get organization users
      (async () => {
        init(); // Initialize the Kinde Management API

        const usersInOrganization = await Organizations.getOrganizationUsers({
          orgCode: context.workspace.orgCode,
          sort: "name_asc",
        });

        return usersInOrganization.organization_users ?? [];
      })(),
    ]);

    return {
      channels,
      members,
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
  .input(z.object({ channelId: z.string() }))
  .output(
    z.object({
      channelName: z.string(),
      currentUser: z.custom<KindeUser<Record<string, unknown>>>(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findUnique({
      where: {
        id: input.channelId,
        workspaceId: context.workspace.orgCode,
      },
      select: { name: true },
    });

    if (!channel) {
      throw errors.NOT_FOUND();
    }

    return {
      channelName: channel.name,
      currentUser: context.user,
    };
  });
