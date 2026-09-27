"use client";

import { WorkspaceActivity, WorkspaceActivityType } from "@/app/schemas/member";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { ReactNode } from "react";

function describeActivity(activity: WorkspaceActivity): ReactNode {
  const target = activity.targetName ?? activity.targetEmail ?? "Someone";
  const actor = activity.actorName ?? activity.actorEmail ?? "Someone";

  switch (activity.type) {
    case WorkspaceActivityType.MemberJoined:
      return (
        <>
          <span className="font-medium text-foreground">{target}</span> joined the workspace
        </>
      );

    case WorkspaceActivityType.MemberLeft:
      return (
        <>
          <span className="font-medium text-foreground">{target}</span> left the workspace
        </>
      );

    case WorkspaceActivityType.MemberRemoved:
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> removed{" "}
          <span className="font-medium text-foreground">{target}</span>
        </>
      );

    default:
      return null;
  }
}

export function MemberActivityFeed({ activities }: { activities: WorkspaceActivity[] }) {
  if (activities.length === 0) {
    return <p className="px-3 py-3 text-xs text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="max-h-56 overflow-y-auto py-1">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-2.5 px-3 py-1.5">
          <UserAvatar
            className="mt-0.5 size-6"
            picture={activity.targetAvatarUrl}
            email={activity.targetEmail}
            name={activity.targetName}
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs leading-snug text-muted-foreground">{describeActivity(activity)}</p>
            <p className="text-[11px] text-muted-foreground/80">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
