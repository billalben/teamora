"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { LogOutIcon, MessageSquareIcon, PencilIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThread } from "@/providers/ThreadProvider";
import { ChannelsTrigger } from "../../../_components/ChannelsTrigger";

import { AddChannelMembers } from "./channel/AddChannelMembers";
import { EditChannel } from "./channel/EditChannel";
import { DeleteChannel } from "./channel/DeleteChannel";
import { LeaveChannel } from "./channel/LeaveChannel";

type ChannelHeaderProps = {
  channelName?: string;
  isAdmin?: boolean;
  isMember?: boolean;
};

export function ChannelHeader({ channelName = "super cool channel", isAdmin, isMember }: ChannelHeaderProps) {
  const { selectedThreadId, isThreadOpen, toggleThread } = useThread();
  const params = useParams<{ channelId: string }>();
  const channelId = params.channelId;

  const [openDialog, setOpenDialog] = useState<"edit" | "delete" | "leave" | null>(null);

  const canManageChannel = Boolean(isAdmin && channelId);
  const canLeave = Boolean(!isAdmin && isMember && channelId);

  return (
    <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <ChannelsTrigger className="shrink-0" />

        <h1 className="truncate text-lg font-semibold"># {channelName}</h1>

        {canManageChannel && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Rename channel"
            onClick={() => setOpenDialog("edit")}
          >
            <PencilIcon className="size-3.5" />
          </Button>
        )}
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

        {canManageChannel && (
          <>
            <AddChannelMembers channelId={channelId} />

            <Button variant="ghost" size="icon" aria-label="Delete channel" onClick={() => setOpenDialog("delete")}>
              <TrashIcon className="size-4 text-destructive" />
            </Button>
          </>
        )}

        {canLeave && (
          <Button variant="ghost" size="icon" aria-label="Leave channel" onClick={() => setOpenDialog("leave")}>
            <LogOutIcon className="size-4" />
          </Button>
        )}
      </div>

      {canManageChannel && (
        <>
          <EditChannel
            channelId={channelId}
            channelName={channelName}
            open={openDialog === "edit"}
            onOpenChange={(open) => setOpenDialog(open ? "edit" : null)}
          />

          <DeleteChannel
            channelId={channelId}
            channelName={channelName}
            open={openDialog === "delete"}
            onOpenChange={(open) => setOpenDialog(open ? "delete" : null)}
          />
        </>
      )}

      {canLeave && (
        <LeaveChannel
          channelId={channelId}
          channelName={channelName}
          open={openDialog === "leave"}
          onOpenChange={(open) => setOpenDialog(open ? "leave" : null)}
        />
      )}
    </div>
  );
}
