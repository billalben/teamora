import { z } from "zod";

export const workspaceSchema = z.object({
  name: z
    .string()
    .min(5, "The workspace name must be at least 5 characters.")
    .max(32, "Workspace name must be at most 32 characters."),
});

export type WorkspaceSchemaType = z.infer<typeof workspaceSchema>;
