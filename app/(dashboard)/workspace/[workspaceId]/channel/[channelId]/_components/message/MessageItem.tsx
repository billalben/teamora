"use client";

import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { AttachmentImage } from "@/components/ui/attachment-image";
import { Message } from "@/lib/generated/prisma/client";
import { getAvatar } from "@/lib/getAvatar";
import Image from "next/image";
import { MessageHoverToolbar } from "../toolbar";
import { useState } from "react";
import { EditMessage } from "../toolbar/EditMessage";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";

type TProps = {
  message: Message;
  user: KindeUser<Record<string, unknown>>;
};

export function MessageItem({ message, user }: TProps) {
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = user.id === message.authorId;
  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

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
          </>
        )}
      </div>

      <MessageHoverToolbar messageId={message.id} canEdit={canEdit} onEdit={handleEdit} />
    </div>
  );
}
