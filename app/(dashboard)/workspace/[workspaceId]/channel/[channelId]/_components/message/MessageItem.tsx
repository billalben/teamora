"use client";

import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { AttachmentImage } from "@/components/ui/attachment-image";
import { getAvatar } from "@/lib/getAvatar";
import type { MessageWithCount } from "@/lib/query/message-cache";
import Image from "next/image";
import { MessageHoverToolbar } from "../toolbar";
import { memo, useMemo, useState } from "react";
import { EditMessage } from "../toolbar/EditMessage";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { MessageSquareIcon } from "lucide-react";
import { useThread } from "@/providers/ThreadProvider";
import { ReactionsBar } from "../reaction/ReactionsBar";
import { groupReactions } from "../reaction/groupReactions";
import { isMessageEdited } from "@/lib/utils";

type MessageItemProps = {
  message: MessageWithCount;
  user: KindeUser<Record<string, unknown>>;
};

export const MessageItem = memo(function MessageItem({ message, user }: MessageItemProps) {
  const { openThread } = useThread();
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = user.id === message.authorId;
  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const groupedReactions = useMemo(
    () => groupReactions(message.messageReactions ?? [], user.id ?? ""),
    [message.messageReactions, user.id]
  );

  return (
    <div className="flex space-x-3 relative p-2 rounded-lg group hover:bg-muted/50">
      <Image
        src={getAvatar({ email: message.authorEmail, picture: message.authorAvatarUrl })}
        alt={message.authorName ?? "unknown"}
        width={32}
        height={32}
        className="size-8 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className="font-medium">{message.authorName}</p>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-GB", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(message.createdAt))}

            {", "}

            {new Intl.DateTimeFormat("en-GB", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(message.createdAt))}

            {isMessageEdited(message.createdAt, message.updatedAt) && (
              <span className="ml-1 text-xs italic text-muted-foreground">(edited)</span>
            )}
          </p>
        </div>

        {isEditing ? (
          <EditMessage message={message} onCancel={() => setIsEditing(false)} onSave={() => setIsEditing(false)} />
        ) : (
          <>
            <SafeContent
              content={JSON.parse(message.content)}
              className="text-sm wrap-break-word max-w-none prose dark:prose-invert marker:text-primary"
            />

            {message.imageUrl && (
              <div className="mt-3">
                <AttachmentImage
                  src={message.imageUrl}
                  alt="Attachment"
                  width={512}
                  height={512}
                  className="rounded-md object-cover max-h-80 w-auto max-w-full"
                />
              </div>
            )}

            <ReactionsBar
              messageId={message.id}
              userId={user.id}
              reactions={groupedReactions}
              context={{ type: "channel", threadId: message.id }}
            />

            {message?._count?.replies > 0 && (
              <button
                type="button"
                className="group mt-1 inline-flex items-center gap-x-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border cursor-pointer"
                onClick={() => openThread(message.id)}
              >
                <MessageSquareIcon className="size-4" />
                <span>
                  {message?._count?.replies} {message?._count?.replies === 1 ? "Reply" : "Replies"}
                </span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  View Thread
                </span>
              </button>
            )}
          </>
        )}
      </div>

      <MessageHoverToolbar messageId={message.id} canEdit={canEdit} onEdit={handleEdit} />
    </div>
  );
});
