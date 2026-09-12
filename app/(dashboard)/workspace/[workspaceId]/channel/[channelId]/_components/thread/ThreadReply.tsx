"use client";

import { memo, useState } from "react";
import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import Image from "next/image";
import { ReactionsBar } from "../reaction/ReactionsBar";
import { groupReactions } from "../reaction/groupReactions";
import { MessageWithCount } from "@/lib/query/message-cache";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { isMessageEdited } from "@/lib/utils";
import { MessageHoverToolbar } from "../toolbar";
import { EditMessage } from "../toolbar/EditMessage";

type ThreadReplyProps = {
  message: MessageWithCount;
  selectedThreadId: string;
  user: KindeUser<Record<string, unknown>>;
};

export const ThreadReply = memo(function ThreadReply({ message, selectedThreadId, user }: ThreadReplyProps) {
  const [isEditing, setIsEditing] = useState(false);

  const groupedReactions = groupReactions(message.messageReactions ?? [], user.id ?? "");
  const canEdit = user.id === message.authorId;
  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className="relative flex gap-3 rounded-lg p-2 group hover:bg-muted/50">
      <Image
        src={message.authorAvatarUrl ?? ""}
        alt={message.authorName}
        width={32}
        height={32}
        className="rounded-full size-8 shrink-0"
      />
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(message.createdAt)}
            {isMessageEdited(message.createdAt, message.updatedAt) && <span className="ml-1 italic">(edited)</span>}
          </span>
        </div>

        {isEditing ? (
          <EditMessage message={message} onCancel={() => setIsEditing(false)} onSave={() => setIsEditing(false)} />
        ) : (
          <>
            <SafeContent
              className="text-sm text-muted-foreground prose dark:prose-invert max-w-none marker:text-primary"
              content={JSON.parse(message.content)}
            />

            {message.imageUrl && (
              <Image
                src={message.imageUrl}
                alt={message.content}
                width={512}
                height={512}
                className="rounded-md object-contain max-h-96 w-auto"
              />
            )}

            <ReactionsBar
              context={{ type: "thread", threadId: selectedThreadId }}
              messageId={message.id}
              userId={user.id}
              reactions={groupedReactions}
            />
          </>
        )}
      </div>

      <MessageHoverToolbar messageId={message.id} canEdit={canEdit} onEdit={handleEdit} showThreadButton={false} />
    </div>
  );
});
