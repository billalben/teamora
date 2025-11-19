import z from "zod";

export const transformChannelName = (name: string) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
};

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
