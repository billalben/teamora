import type { RealtimeMessage } from "@/app/schemas/realtime";
import type { Message } from "@/lib/generated/prisma/client";
import { InfiniteMessages, MessageListPage, messageListInfiniteKey } from "@/lib/query/message-keys";
import { orpc } from "@/lib/orpc";
import type { QueryClient } from "@tanstack/react-query";

export type MessageWithCount = Message & {
  _count: { replies: number };
  messageReactions: { emoji: string; userId: string }[];
};

export type ThreadMessages = {
  parent: MessageWithCount;
  messages: MessageWithCount[];
};

function toMessageWithCount(message: RealtimeMessage): MessageWithCount {
  return {
    ...message,
    content: message.content ?? "",
    imageUrl: message.imageUrl ?? null,
    createdAt: new Date(message.createdAt),
    updatedAt: new Date(message.updatedAt),
    authorEmail: message.authorEmail ?? "",
    authorName: message.authorName ?? "unknown",
    authorAvatarUrl: message.authorAvatarUrl ?? null,
    threadId: message.threadId ?? null,
    messageReactions: message.messageReactions ?? [],
    _count: message._count ?? { replies: 0 },
  };
}

export function upsertChannelMessage(queryClient: QueryClient, channelId: string, message: RealtimeMessage) {
  const normalized = toMessageWithCount(message);

  queryClient.setQueryData<InfiniteMessages>(messageListInfiniteKey(channelId), (old) => {
    if (!old) {
      return { pages: [{ items: [normalized], nextCursor: null }], pageParams: [undefined] };
    }

    if (old.pages.some((page) => page.items.some((item) => item.id === normalized.id))) {
      return old;
    }

    const first = old.pages[0];

    return {
      ...old,
      pages: [{ ...first, items: [normalized, ...first.items] }, ...old.pages.slice(1)],
    };
  });
}

export function replaceChannelMessage(queryClient: QueryClient, channelId: string, message: RealtimeMessage) {
  queryClient.setQueryData<InfiniteMessages>(messageListInfiniteKey(channelId), (old) => {
    if (!old) return old;

    let changed = false;

    const pages = old.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        if (item.id !== message.id) return item;

        changed = true;
        // merge so fields absent from the realtime payload survive
        return { ...item, ...message };
      }),
    }));

    return changed ? { ...old, pages } : old;
  });
}

export function patchMessageReactions(
  queryClient: QueryClient,
  messageId: string,
  messageReactions: { emoji: string; userId: string }[]
) {
  const patchChannelPages = (pages: MessageListPage[]) => {
    let changed = false;

    const next = pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        if (item.id !== messageId) return item;

        changed = true;
        return { ...item, messageReactions };
      }),
    }));

    return changed ? next : null;
  };

  // patch every cached channel list
  queryClient.setQueriesData<InfiniteMessages>({ queryKey: orpc.message.list.key() }, (old) => {
    if (!old) return old;

    const pages = patchChannelPages(old.pages);
    return pages ? { ...old, pages } : old;
  });

  // patch every cached thread (parent + replies)
  queryClient.setQueriesData<ThreadMessages>({ queryKey: orpc.message.thread.list.key() }, (old) => {
    if (!old) return old;

    let changed = false;

    const apply = (item: MessageWithCount) => {
      if (item.id !== messageId) return item;

      changed = true;
      return { ...item, messageReactions };
    };

    const parent = apply(old.parent);
    const messages = old.messages.map(apply);

    return changed ? { ...old, parent, messages } : old;
  });
}

export function incrementReplyCount(queryClient: QueryClient, messageId: string, delta: number) {
  queryClient.setQueriesData<InfiniteMessages>({ queryKey: orpc.message.list.key() }, (old) => {
    if (!old) return old;

    let changed = false;

    const pages = old.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        if (item.id !== messageId) return item;

        changed = true;
        const current = item._count?.replies ?? 0;

        return { ...item, _count: { replies: Math.max(0, current + delta) } };
      }),
    }));

    return changed ? { ...old, pages } : old;
  });
}

export function appendThreadReply(queryClient: QueryClient, threadId: string, reply: RealtimeMessage) {
  const normalized = toMessageWithCount(reply);

  queryClient.setQueriesData<ThreadMessages>({ queryKey: orpc.message.thread.list.key() }, (old) => {
    if (!old || old.parent.id !== threadId) return old;

    if (old.messages.some((message) => message.id === normalized.id)) {
      return old;
    }

    return { ...old, messages: [...old.messages, normalized] };
  });
}

export function replaceThreadMessage(queryClient: QueryClient, message: RealtimeMessage) {
  queryClient.setQueriesData<ThreadMessages>({ queryKey: orpc.message.thread.list.key() }, (old) => {
    if (!old) return old;

    let changed = false;

    const apply = (item: MessageWithCount) => {
      if (item.id !== message.id) return item;

      changed = true;
      // merge so fields absent from the realtime payload survive
      return { ...item, ...message } as MessageWithCount;
    };

    const parent = apply(old.parent);
    const messages = old.messages.map(apply);

    return changed ? { ...old, parent, messages } : old;
  });
}
