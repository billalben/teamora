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

export const ReactionSchema = z.object({
  emoji: z.string(),
  userId: z.string(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

// Minimal message shape for realtime events
export const RealtimeMessageSchema = z.object({
  id: z.string(),
  content: z.string().optional().nullable(),
  imageUrl: z.url().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().optional().nullable(),

  authorId: z.string(),
  authorEmail: z.email().optional().nullable(),
  authorName: z.string().optional().nullable(),
  authorAvatarUrl: z.string().optional().nullable(),

  channelId: z.string().nullable(),
  threadId: z.string().optional().nullable(),

  messageReactions: z.array(ReactionSchema).optional(),
  _count: z.object({ replies: z.number() }).optional(),
});

export type RealtimeMessage = z.infer<typeof RealtimeMessageSchema>;

// Events scoped to a single channel room. Threads live in the same room:
// a reply is just a message with `threadId` set.
export const RealtimeEventSchema = z.union([
  z.object({
    type: z.literal("message:created"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:updated"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:deleted"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:restored"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("thread:reply:created"),
    payload: z.object({ message: RealtimeMessageSchema.extend({ threadId: z.string() }) }),
  }),
  z.object({
    type: z.literal("reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      threadId: z.string().nullable(),
      messageReactions: z.array(ReactionSchema),
    }),
  }),
]);

export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
