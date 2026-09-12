import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.email().nullable(),
  picture: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const PresenceMessageSchema = z.union([
  z.object({
    type: z.literal("add-user"),
    payload: UserSchema,
  }),
  z.object({
    type: z.literal("remove-user"),
    payload: z.object({ id: z.string() }),
  }),
  z.object({
    type: z.literal("presence"),
    payload: z.object({ users: z.array(UserSchema) }),
  }),
]);

export type PresenceMessage = z.infer<typeof PresenceMessageSchema>;

// Minial message shape for realtime events
export const RealtimeMessageSchema = z.object({
  id: z.string(),
  content: z.string().optional().nullable(),
  imageUrl: z.url().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  authorId: z.string(),
  authorEmail: z.email().optional().nullable(),
  authorName: z.string().optional().nullable(),
  authorAvatarUrl: z.string().optional().nullable(),

  channelId: z.string().nullable(),
  threadId: z.string().optional().nullable(),

  messageReactions: z.array(z.object({ emoji: z.string(), userId: z.string() })).optional(),
  _count: z.object({ replies: z.number() }).optional(),
  replyCount: z.number().optional(),
});

export type RealtimeMessage = z.infer<typeof RealtimeMessageSchema>;

// Channel-level events
export const ChannelEventSchema = z.union([
  z.object({
    type: z.literal("message:created"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:updated"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      messageReactions: z.array(z.object({ emoji: z.string(), userId: z.string() })),
    }),
  }),
  z.object({
    type: z.literal("message:replies:increment"),
    payload: z.object({
      messageId: z.string(),
      delta: z.number(),
    }),
  }),
]);

export type ChannelEvent = z.infer<typeof ChannelEventSchema>;
