"use client";

import { Button } from "@/components/ui/button";
import { useThread } from "@/providers/ThreadProvider";
import type { MessageWithCount } from "@/lib/query/message-cache";
import { MessageSquareTextIcon, PencilIcon } from "lucide-react";
import { DeleteMessageButton } from "./DeleteMessageButton";

type MessageHoverToolbarProps = {
  message: MessageWithCount;
  canEdit: boolean;
  onEdit: () => void;
  showThreadButton?: boolean;
};

export function MessageHoverToolbar({ message, canEdit, onEdit, showThreadButton = true }: MessageHoverToolbarProps) {
  const { toggleThread } = useThread();
  const canManage = canEdit && !message.deletedAt;

  return (
    <div className="absolute -right-2 -top-3 items-center gap-1 rounded-md border-gray-200 bg-white/90 px-1.5 py-1 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-0 dark:border-neutral-800 dark:bg-neutral-900/90">
      {canManage && (
        <>
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit message">
            <PencilIcon className="size-4" />
          </Button>

          <DeleteMessageButton message={message} />
        </>
      )}

      {showThreadButton && !message.deletedAt && (
        <Button variant="ghost" size="icon" onClick={() => toggleThread(message.id)} aria-label="Open thread">
          <MessageSquareTextIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}
