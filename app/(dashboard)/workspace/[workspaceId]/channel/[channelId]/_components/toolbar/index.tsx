"use client";

import { Button } from "@/components/ui/button";
import { useThread } from "@/providers/ThreadProvider";
import { MessageSquareTextIcon, PencilIcon } from "lucide-react";

type MessageHoverToolbarProps = {
  messageId: string;
  canEdit: boolean;
  onEdit: () => void;
  showThreadButton?: boolean;
};

export function MessageHoverToolbar({ messageId, canEdit, onEdit, showThreadButton = true }: MessageHoverToolbarProps) {
  const { toggleThread } = useThread();
  return (
    <div className="absolute -right-2 -top-3 items-center gap-1 rounded-md border-gray-200 bg-white/90 px-1.5 py-1 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-0 dark:border-neutral-800 dark:bg-neutral-900/90">
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <PencilIcon className="size-4" />
        </Button>
      )}

      {showThreadButton && (
        <Button variant="ghost" size="icon" onClick={() => toggleThread(messageId)}>
          <MessageSquareTextIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}
