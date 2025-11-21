"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/getAvatar";
import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";

export function WorkspaceMembersList() {
  const { data } = useSuspenseQuery(orpc.channel.list.queryOptions());

  return (
    <div className="space-y-1 py-1">
      {data.members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-2 py-1 hover:bg-accent rounded-md cursor-pointer transition-colors"
        >
          <Avatar className="size-6 relative">
            <Image
              src={getAvatar({ picture: member.picture, email: member.email })}
              alt={member.full_name || "User Avatar"}
              fill
              className="object-cover"
            />
            <AvatarFallback>{member?.full_name?.charAt(0) ?? "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none">{member.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
