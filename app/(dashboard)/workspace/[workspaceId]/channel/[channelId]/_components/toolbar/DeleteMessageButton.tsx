"use client";

import { Button } from "@/components/ui/button";
import { useDeleteMessage } from "@/hooks/use-message-deletion";
import type { MessageWithCount } from "@/lib/query/message-cache";
import { Loader2Icon, Trash2Icon } from "lucide-react";

type DeleteMessageButtonProps = {
  message: MessageWithCount;
};

export function DeleteMessageButton({ message }: DeleteMessageButtonProps) {
  const { deleteMessage, isPending } = useDeleteMessage(message);

  return (
    <Button variant="ghost" size="icon" onClick={deleteMessage} disabled={isPending} aria-label="Delete message">
      {isPending ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
    </Button>
  );
}
