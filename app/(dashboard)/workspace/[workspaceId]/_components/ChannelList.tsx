"use client";

import { buttonVariants } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HashIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function ChannelList() {
  const { data } = useSuspenseQuery(orpc.channel.list.queryOptions());

  const params = useParams<{ workspaceId: string; channelId: string }>();

  return (
    <div className="space-x-0.5 py-1">
      {data.channels.length === 0 ? (
        <p className="text-sm text-muted-foreground px-3">No channels available.</p>
      ) : (
        data.channels.map((channel) => {
          const isActive = channel.id === params.channelId;

          return (
            <Link
              key={channel.id}
              href={`/workspace/${params.workspaceId}/channel/${channel.id}`}
              className={buttonVariants({
                variant: "ghost",
                className: cn(
                  "w-full justify-start px-2 py-1 text-sm text-muted-foreground hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                ),
              })}
            >
              <HashIcon size={16} />
              <span className="truncate">{channel.name}</span>
            </Link>
          );
        })
      )}
    </div>
  );
}
