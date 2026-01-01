"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageItem } from "./message/MessageItem";
import { orpc } from "@/lib/orpc";
import { useParams } from "next/navigation";

export function MessagesList() {
  const params = useParams<{ channelId: string }>();

  const { data: MESSAGES } = useQuery(
    orpc.message.list.queryOptions({
      input: {
        channelId: params.channelId,
      },
    })
  );

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4">
        {MESSAGES?.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}
