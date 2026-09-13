import z, { string } from "zod";

export const inviteMemberSchema = z.object({
  name: string().min(3).max(50),
  email: z.email(),
});

export type InviteMemberSchemaType = z.infer<typeof inviteMemberSchema>;
