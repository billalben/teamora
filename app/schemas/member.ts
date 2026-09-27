import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.email("Please enter a valid email address."),
  channelIds: z.array(z.string().min(1)).optional(),
});

export type InviteMemberSchemaType = z.infer<typeof inviteMemberSchema>;

const ADMIN_ROLE_KEYS = new Set(["admin", "owner"]);

/**
 * Kinde organizations use role keys; the workspace creator is assigned
 * "admin" while Kinde-managed owners use "owner". Both can manage members.
 */
export function isWorkspaceAdmin(roles?: string[] | null) {
  return roles?.some((role) => ADMIN_ROLE_KEYS.has(role.toLowerCase())) ?? false;
}

export const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

export type RemoveMemberSchemaType = z.infer<typeof removeMemberSchema>;

export const memberActivityListSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(20),
});

export type MemberActivityListSchemaType = z.infer<typeof memberActivityListSchema>;

export const WorkspaceActivityType = {
  MemberJoined: "MEMBER_JOINED",
  MemberLeft: "MEMBER_LEFT",
  MemberRemoved: "MEMBER_REMOVED",
} as const;

export type WorkspaceActivityTypeValue = (typeof WorkspaceActivityType)[keyof typeof WorkspaceActivityType];

export const workspaceActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  workspaceId: z.string(),
  actorId: z.string().nullish(),
  actorEmail: z.string().nullish(),
  actorName: z.string().nullish(),
  actorAvatarUrl: z.string().nullish(),
  targetId: z.string(),
  targetEmail: z.string().nullish(),
  targetName: z.string().nullish(),
  targetAvatarUrl: z.string().nullish(),
  createdAt: z.date(),
});

export type WorkspaceActivity = z.infer<typeof workspaceActivitySchema>;
