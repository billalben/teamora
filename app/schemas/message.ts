import z from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1, { message: "Message content cannot be empty" }),
  channelId: z.string().min(1, { message: "Channel ID is required" }),
  imageUrl: z.url().optional(),
  threadId: z.string().optional(),
});

export const updateMessageSchema = z.object({
  messageId: z.string(),
  content: z.string().min(1, { message: "Message content cannot be empty" }),
  imageUrl: z.url().nullish(),
});

export const toggleMessageReactionSchema = z.object({
  messageId: z.string(),
  emoji: z.string().min(1, { message: "Emoji is required" }),
});

export const groupReactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  reactedByMe: z.boolean(),
});

export type CreateMessageSchemaType = z.infer<typeof createMessageSchema>;
export type UpdateMessageSchemaType = z.infer<typeof updateMessageSchema>;
export type ToggleMessageReactionSchemaType = z.infer<typeof toggleMessageReactionSchema>;
export type GroupReactionSchemaType = z.infer<typeof groupReactionSchema>;
