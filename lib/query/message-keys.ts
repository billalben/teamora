import type { RealtimeMessage } from "@/app/schemas/realtime";
import { orpc } from "@/lib/orpc";
import type { InfiniteData } from "@tanstack/react-query";

export const MESSAGE_PAGE_SIZE = 8;

export type MessageListPage = { items: RealtimeMessage[]; nextCursor: string | null };
export type InfiniteMessages = InfiniteData<MessageListPage>;

export function messageListInfiniteKey(channelId: string) {
  return orpc.message.list.key({
    type: "infinite",
    input: { channelId, cursor: undefined, limit: MESSAGE_PAGE_SIZE },
  });
}

export function threadMessagesKey(threadId: string) {
  return orpc.message.thread.list.key({ type: "query", input: { messageId: threadId } });
}
