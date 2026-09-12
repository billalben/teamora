import { Button } from "@/components/ui/button";
import { MessageSquareIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { ThreadReply } from "./ThreadReply";
import { ThreadReplyForm } from "./ThreadReplyForm";
import { useThread } from "@/providers/ThreadProvider";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { ThreadSidebarSkeleton } from "./ThreadSidebarSkeleton";
import { ReactionsBar } from "../reaction/ReactionsBar";
import { groupReactions } from "../reaction/groupReactions";
import { SummarizeThread } from "./SummarizeThread";
import { isMessageEdited } from "@/lib/utils";

export function ThreadSidebarContent() {
  const { selectedThreadId, closeThread } = useThread();

  const {
    data: { user },
  } = useSuspenseQuery(orpc.workspace.list.queryOptions());

  const { data: threadData, isLoading: isLoadingThread } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },
      enabled: !!selectedThreadId,
    })
  );

  if (isLoadingThread) {
    return <ThreadSidebarSkeleton />;
  }

  const parentReactions = threadData ? groupReactions(threadData.parent.messageReactions ?? [], user.id ?? "") : [];

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4" />
          <span className="text-sm font-medium">Thread</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedThreadId && <SummarizeThread messageId={selectedThreadId} />}

          <Button variant="outline" size="icon" onClick={closeThread}>
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {threadData && (
          <div className="h-full bg-muted/20 p-4">
            <div className="flex gap-3">
              <Image
                src={threadData.parent.authorAvatarUrl ?? ""}
                alt={threadData.parent.authorName}
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{threadData.parent.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(
                      threadData.parent.createdAt
                    )}
                    {isMessageEdited(threadData.parent.createdAt, threadData.parent.updatedAt) && (
                      <span className="ml-1 italic">(edited)</span>
                    )}
                  </span>
                </div>

                <SafeContent
                  className="text-sm text-muted-foreground"
                  content={JSON.parse(threadData.parent.content)}
                />

                <ReactionsBar
                  context={{ type: "thread", threadId: threadData.parent.id }}
                  messageId={threadData.parent.id}
                  userId={user.id}
                  reactions={parentReactions}
                />
              </div>
            </div>

            {/* Thread Replies */}
            <div className="space-y-2 p-2">
              <p className="text-sm text-muted-foreground">{threadData.messages.length} replies</p>

              <div className="space-y-3">
                {selectedThreadId &&
                  threadData.messages.map((reply) => (
                    <ThreadReply key={reply.id} message={reply} selectedThreadId={selectedThreadId} user={user} />
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
