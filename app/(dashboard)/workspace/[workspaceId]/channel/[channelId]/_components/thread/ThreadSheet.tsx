import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useThread } from "@/providers/ThreadProvider";

import { ThreadSidebarContent } from "./ThreadSidebarContent";

export function ThreadSheet() {
  const { isThreadOpen, closeThread } = useThread();

  return (
    <Sheet
      open={isThreadOpen}
      onOpenChange={(open) => {
        if (!open) closeThread();
      }}
    >
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>Thread</SheetTitle>
          <SheetDescription>Replies to the selected message.</SheetDescription>
        </SheetHeader>

        <div className="h-full min-h-0 w-full">
          <ThreadSidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
