import z from "zod";

export function transformChannelName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

export const channelNameSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Channel name must be at least 3 characters long" })
    .max(50, { message: "Channel name must be at most 50 characters long" })
    .transform((name, ctx) => {
      const transformedName = transformChannelName(name);
      if (transformedName.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Channel name must contain at least 2 valid characters after transformation",
        });

        return z.NEVER;
      }

      return transformedName;
    }),
});

export type ChannelNameSchemaType = z.infer<typeof channelNameSchema>;

export const updateChannelSchema = channelNameSchema.extend({
  channelId: z.string().min(1),
});

export type UpdateChannelSchemaType = z.infer<typeof updateChannelSchema>;

export const channelIdSchema = z.object({
  channelId: z.string().min(1),
});

export type ChannelIdSchemaType = z.infer<typeof channelIdSchema>;

export const addChannelMemberSchema = z.object({
  channelId: z.string().min(1),
  userId: z.string().min(1),
});

export type AddChannelMemberSchemaType = z.infer<typeof addChannelMemberSchema>;

export const removeChannelMemberSchema = z.object({
  channelId: z.string().min(1),
  userId: z.string().min(1),
});

export type RemoveChannelMemberSchemaType = z.infer<typeof removeChannelMemberSchema>;

export const updateChannelMembersSchema = z.object({
  channelId: z.string().min(1),
  userIds: z.array(z.string().min(1)),
});

export type UpdateChannelMembersSchemaType = z.infer<typeof updateChannelMembersSchema>;
