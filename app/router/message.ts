import z from "zod";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { writeSecurityMiddleware } from "../middlewares/arcjet/write";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorspaceMiddleware } from "../middlewares/workspace";
import prisma from "@/lib/prisma";
import { createMessageSchema } from "../schemas/message";
import { getAvatar } from "@/lib/getAvatar";
import { Message } from "@/lib/generated/prisma/client";

export const createMessage = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/messages",
    summary: "Create Message",
    description: "Create a new message in a channel.",
    tags: ["Message"],
  })
  .input(createMessageSchema)
  .output(z.custom<Message>())
  .handler(async ({ input, context, errors }) => {
    // verify the channel belongs to the workspace

    const channel = await prisma.channel.findUnique({
      where: {
        id: input.channelId,
        workspaceId: context.workspace.orgCode,
      },
    });

    if (!channel) {
      throw errors.FORBIDDEN(); // channel not found or doesn't belong to workspace
    }

    const created = await prisma.message.create({
      data: {
        content: input.content,
        imageUrl: input.imageUrl,
        channelId: input.channelId,
        authorId: context.user.id,
        authorAvatarUrl: getAvatar({ email: context.user.email, picture: context.user.picture }),
        authorEmail: context.user.email!,
        authorName: context.user.given_name ?? "unknown",
      },
    });

    return {
      ...created,
    };
  });
