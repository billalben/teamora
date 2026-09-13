"use client";

import { useMemo } from "react";
import { User } from "@/app/schemas/realtime";
import { usePresence } from "@/hooks/use-presence";
import { orpc } from "@/lib/orpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

export function WorkspaceMembersList() {
  const {
    data: { members },
  } = useSuspenseQuery(orpc.channel.list.queryOptions());

  const { data: workspaceData } = useQuery(orpc.workspace.list.queryOptions());

  const currentUser = workspaceData?.user
    ? ({
        id: workspaceData.user.id,
        email: workspaceData.user.email,
        full_name: workspaceData.user.given_name,
        picture: workspaceData.user.picture,
      } satisfies User)
    : null;

  const params = useParams();

  const workspaceId = params.workspaceId;

  const { onlineUsers } = usePresence({
    room: `workspace-${workspaceId}`,
    currentUser: currentUser,
  });

  const onlineUsersIds = useMemo(() => {
    return new Set(onlineUsers.map((user) => user.id));
  }, [onlineUsers]);

  return (
    <div className="space-y-1 py-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-2 py-1 hover:bg-accent rounded-md cursor-pointer transition-colors"
        >
          <UserAvatar className="size-8" picture={member.picture} email={member.email} name={member.full_name}>
            {/* online/offline status indicator */}
            <div
              className={cn(
                "absolute right-0 bottom-0 size-3 rounded-full border border-background",
                member.id && onlineUsersIds.has(member.id) ? "bg-green-500" : "bg-gray-400"
              )}
            ></div>
          </UserAvatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none">{member.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
