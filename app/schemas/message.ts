import z from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1, { message: "Message content cannot be empty" }),
  channelId: z.string().min(1, { message: "Channel ID is required" }),
  imageUrl: z.url().optional(),
});

export type CreateMessageSchemaType = z.infer<typeof createMessageSchema>;
