"use client";

import { Button } from "@/components/ui/button";
import { useRestoreMessage } from "@/hooks/use-message-deletion";
import type { MessageWithCount } from "@/lib/query/message-cache";
import { Loader2Icon } from "lucide-react";

type UndoDeleteButtonProps = {
  message: MessageWithCount;
};

export function UndoDeleteButton({ message }: UndoDeleteButtonProps) {
  const { restoreMessage, isPending } = useRestoreMessage(message);

  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto p-0 text-xs font-medium"
      onClick={restoreMessage}
      disabled={isPending}
    >
      {isPending && <Loader2Icon className="mr-1 size-3 animate-spin" />}
      Undo
    </Button>
  );
}
