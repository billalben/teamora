import z from "zod";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { writeSecurityMiddleware } from "../middlewares/arcjet/write";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorspaceMiddleware } from "../middlewares/workspace";
import prisma from "@/lib/prisma";
import { createMessageSchema, toggleMessageReactionSchema, updateMessageSchema } from "../schemas/message";
import { getAvatar } from "@/lib/getAvatar";
import { Message } from "@/lib/generated/prisma/client";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";

type MessageReactions = { messageReactions: { emoji: string; userId: string }[] };
const messageWithReactions = z.custom<Message & MessageReactions & { _count: { replies: number } }>();
const messageWithReactionsOnly = z.custom<Message & MessageReactions>();

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
  .output(messageWithReactionsOnly)
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

    // if this is a thread reply, validate the parent message
    if (input.threadId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: input.threadId, channel: { workspaceId: context.workspace.orgCode } },
      });

      if (!parentMessage || parentMessage.channelId !== input.channelId || parentMessage.threadId !== null) {
        throw errors.NOT_FOUND(); // parent message not found
      }
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
        threadId: input.threadId ?? null,
      },
      include: {
        messageReactions: { select: { emoji: true, userId: true } },
      },
    });

    return created;
  });

export const listMessages = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/messages",
    summary: "List Messages",
    description: "List messages in a channel.",
    tags: ["Message"],
  })
  .input(
    z.object({
      channelId: z.string(),
      limit: z.number().min(1).max(50).optional().default(25),
      cursor: z.string().optional(),
    })
  )
  .output(
    z.object({
      items: z.array(messageWithReactions),
      nextCursor: z.string().nullable(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const channel = await prisma.channel.findUnique({
      where: {
        id: input.channelId,
        workspaceId: context.workspace.orgCode,
      },
    });

    if (!channel) {
      throw errors.FORBIDDEN(); // channel not found or doesn't belong to workspace
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId: input.channelId,
        threadId: null,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
      include: {
        _count: { select: { replies: true } },
        messageReactions: { select: { emoji: true, userId: true } },
      },
    });

    const hasMore = messages.length > input.limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    return {
      items,
      nextCursor,
    };
  });

export const updateMessage = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "PUT",
    path: "/messages/:messageId",
    summary: "Update Message",
    description: "Update a message in a channel.",
    tags: ["Message"],
  })
  .input(updateMessageSchema)
  .output(
    z.object({
      message: messageWithReactionsOnly,
      canEdit: z.boolean(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const message = await prisma.message.findUnique({
      where: { id: input.messageId, channel: { workspaceId: context.workspace.orgCode } },
      select: { id: true, authorId: true },
    });

    if (!message) {
      throw errors.NOT_FOUND(); // message not found
    }

    if (message.authorId !== context.user.id) {
      throw errors.FORBIDDEN(); // user is not the author of the message
    }

    const updated = await prisma.message.update({
      where: { id: input.messageId },
      data: { content: input.content },
      include: {
        messageReactions: { select: { emoji: true, userId: true } },
      },
    });

    return {
      message: updated,
      canEdit: updated.authorId === context.user.id,
    };
  });

export const listThreadReplies = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/messages/:messageId/thread",
    summary: "List Thread Replies",
    description: "List replies to a thread.",
    tags: ["Message"],
  })
  .input(z.object({ messageId: z.string() }))
  .output(
    z.object({
      parent: messageWithReactions,
      messages: z.array(messageWithReactions),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const parentRow = await prisma.message.findUnique({
      where: { id: input.messageId, channel: { workspaceId: context.workspace.orgCode } },
      include: {
        _count: { select: { replies: true } },
        messageReactions: { select: { emoji: true, userId: true } },
      },
    });

    if (!parentRow) {
      throw errors.NOT_FOUND(); // parent message not found
    }

    const replies = await prisma.message.findMany({
      where: { threadId: input.messageId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: {
        _count: { select: { replies: true } },
        messageReactions: { select: { emoji: true, userId: true } },
      },
    });

    return {
      parent: parentRow,
      messages: replies,
    };
  });

export const toggleMessageReaction = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/messages/:messageId/reactions",
    summary: "Toggle Message Reaction",
    description: "Toggle a reaction on a message.",
    tags: ["Message"],
  })
  .input(toggleMessageReactionSchema)
  .output(
    z.object({
      messageId: z.string(),
      messageReactions: z.array(z.object({ emoji: z.string(), userId: z.string() })),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const message = await prisma.message.findUnique({
      where: {
        id: input.messageId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      select: { id: true },
    });

    if (!message) {
      throw errors.NOT_FOUND(); // message not found
    }

    const inserted = await prisma.messageReaction.createMany({
      data: [
        {
          emoji: input.emoji,
          messageId: input.messageId,
          userId: context.user.id,
          userName: context.user.given_name ?? "unknown",
          userEmail: context.user.email ?? "",
          userAvatarUrl: getAvatar({ email: context.user.email, picture: context.user.picture }),
        },
      ],
      skipDuplicates: true,
    });

    if (inserted.count === 0) {
      await prisma.messageReaction.deleteMany({
        where: {
          userId: context.user.id,
          messageId: input.messageId,
          emoji: input.emoji,
        },
      });
    }

    const updated = await prisma.message.findUnique({
      where: { id: input.messageId },
      include: {
        messageReactions: { select: { emoji: true, userId: true } },
        _count: { select: { replies: true } },
      },
    });

    if (!updated) {
      throw errors.NOT_FOUND(); // message not found
    }

    return {
      messageId: updated.id,
      messageReactions: (updated.messageReactions ?? []).map((r) => ({ emoji: r.emoji, userId: r.userId })),
    };
  });
