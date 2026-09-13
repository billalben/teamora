import type { MessageWithCount } from "@/lib/query/message-cache";
import { UndoDeleteButton } from "../toolbar/UndoDeleteButton";

type DeletedMessagePlaceholderProps = {
  message: MessageWithCount;
  canUndo: boolean;
};

export function DeletedMessagePlaceholder({ message, canUndo }: DeletedMessagePlaceholderProps) {
  return (
    <div className="flex items-center gap-2 text-sm italic text-muted-foreground">
      <span>This message has been deleted.</span>
      {canUndo && <UndoDeleteButton message={message} />}
    </div>
  );
}
