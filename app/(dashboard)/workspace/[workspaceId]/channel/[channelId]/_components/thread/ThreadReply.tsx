import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { Message } from "@/lib/generated/prisma/client";
import Image from "next/image";

interface ThreadReplyProps {
  message: Message;
}

export default function ThreadReply({ message }: ThreadReplyProps) {
  return (
    <div className="flex gap-3">
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
          </span>
        </div>

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
      </div>
    </div>
  );
}
