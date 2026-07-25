import { Button } from "@/components/ui/button";
import { MessageSquareIcon, XIcon } from "lucide-react";
import Image from "next/image";
import ThreadReply from "./ThreadReply";
import ThreadReplyForm from "./ThreadReplyForm";
import { useThread } from "@/providers/ThreadProvider";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { SafeContent } from "@/components/rich-text-editor/SafeContent";

export default function ThreadSidebar() {
  const { selectedThreadId, closeThread } = useThread();

  const { data: threadData } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },
      enabled: !!selectedThreadId,
    })
  );

  return (
    <div className="w-120 border-l flex flex-col h-full">
      {/* Header */}
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4" />
          <span className="text-sm font-medium">Thread</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={closeThread}>
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {threadData && (
          <div className="p-4 border-b bg-muted/20">
            <div className="flex gap-3">
              <Image
                src={threadData.parent.authorAvatarUrl ?? ""}
                alt={threadData.parent.authorName}
                width={32}
                height={32}
                className="rounded-full size-8 shrink-0"
              />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{threadData.parent.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(
                      threadData.parent.createdAt
                    )}
                  </span>
                </div>

                <SafeContent
                  className="text-sm text-muted-foreground"
                  content={JSON.parse(threadData.parent.content)}
                />
              </div>
            </div>

            {/* Thread Replies */}
            <div className="p-2 space-y-2">
              <p className="text-sm text-muted-foreground">{threadData.messages.length} replies</p>

              <div className="space-y-3">
                {threadData.messages.map((reply) => (
                  <ThreadReply key={reply.id} message={reply} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thread Reply form */}
      <div className="border-t p-4">{selectedThreadId && <ThreadReplyForm threadId={selectedThreadId} />}</div>
    </div>
  );
}
