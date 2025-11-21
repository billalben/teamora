"use client";

import { buttonVariants } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HashIcon } from "lucide-react";
import Link from "next/link";

export function ChannelList() {
  const { data } = useSuspenseQuery(orpc.channel.list.queryOptions());
  return (
    <div className="space-x-0.5 py-1">
      {data.channels.map((channel) => (
        <Link
          key={channel.id}
          href="#"
          className={buttonVariants({
            variant: "ghost",
            className: cn("w-full justify-start px-2 py-1 text-sm text-muted-foreground hover:text-accent-foreground"),
          })}
        >
          <HashIcon size={16} />
          <span className="truncate">{channel.name}</span>
        </Link>
      ))}
    </div>
  );
}
