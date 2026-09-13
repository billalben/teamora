"use client";

import { MessageSquareIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useThread } from "@/providers/ThreadProvider";
import { ChannelsTrigger } from "../../../_components/ChannelsTrigger";

import { InviteMember } from "./member/InviteMember";
import { MembersOverview } from "./member/MembersOverview";

type ChannelHeaderProps = {
  channelName?: string;
};

export function ChannelHeader({ channelName = "super cool channel" }: ChannelHeaderProps) {
  const { selectedThreadId, isThreadOpen, toggleThread } = useThread();

  return (
    <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <ChannelsTrigger className="shrink-0" />

        <h1 className="truncate text-lg font-semibold"># {channelName}</h1>
      </div>

      <div className="flex shrink-0 items-center space-x-2">
        {selectedThreadId && (
          <Button
            variant={isThreadOpen ? "secondary" : "ghost"}
            size="icon"
            onClick={() => toggleThread(selectedThreadId)}
            aria-label="Toggle thread"
          >
            <MessageSquareIcon className="size-4" />
          </Button>
        )}

        <MembersOverview />
        <InviteMember />
        <ThemeToggle />
      </div>
    </div>
  );
}
