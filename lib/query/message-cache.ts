import type { Reaction, RealtimeMessage } from "@/app/schemas/realtime";
import type { Message } from "@/lib/generated/prisma/client";
import { InfiniteMessages, MessageListPage, messageListInfiniteKey, threadMessagesKey } from "@/lib/query/message-keys";
import type { QueryClient } from "@tanstack/react-query";

export type MessageWithCount = Message & {
  _count: { replies: number };
  messageReactions: Reaction[];
};

export type ThreadMessages = {
  parent: MessageWithCount;
  messages: MessageWithCount[];
};

export type OptimisticMessageInput = {
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  imageUrl?: string | null;
  threadId?: string | null;
  authorEmail?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
};

export function buildOptimisticMessage(input: OptimisticMessageInput): MessageWithCount {
  const now = new Date();

  return {
    id: input.id,
    content: input.content,
    imageUrl: input.imageUrl ?? null,
    createdAt: now,
    updatedAt: now,
    authorId: input.authorId,
    authorEmail: input.authorEmail ?? "",
    authorName: input.authorName ?? "unknown",
    authorAvatarUrl: input.authorAvatarUrl ?? null,
    channelId: input.channelId,
    threadId: input.threadId ?? null,
    messageReactions: [],
    _count: { replies: 0 },
  };
}

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

/**
 * Finds the page holding `messageId` and replaces only that item, keeping every
 * other page/item reference intact. Returns null when nothing matched so callers
 * can return the previous data and avoid re-rendering subscribers.
 */
function updateMessageInPages(
  pages: MessageListPage[],
  messageId: string,
  updater: (message: RealtimeMessage) => RealtimeMessage
): MessageListPage[] | null {
  let changed = false;

  const nextPages = pages.map((page) => {
    const index = page.items.findIndex((item) => item.id === messageId);
    if (index === -1) return page;

    changed = true;

    const items = page.items.slice();
    items[index] = updater(items[index]);

    return { ...page, items };
  });

  return changed ? nextPages : null;
}

function replaceAndDedupe<T extends { id: string }>(items: T[], tempId: string, message: T): T[] {
  const seen = new Set<string>();

  return items
    .map((item) => (item.id === tempId ? message : item))
    .filter((item) => {
      if (item.id !== message.id) return true;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
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

export function reconcileChannelMessage(
  queryClient: QueryClient,
  channelId: string,
  tempId: string,
  message: RealtimeMessage
) {
  const normalized = toMessageWithCount(message);

  queryClient.setQueryData<InfiniteMessages>(messageListInfiniteKey(channelId), (old) => {
    if (!old) {
      return { pages: [{ items: [normalized], nextCursor: null }], pageParams: [undefined] };
    }

    const pages = old.pages.map((page) => ({
      ...page,
      items: replaceAndDedupe(page.items, tempId, normalized),
    }));

    return { ...old, pages };
  });
}

export function appendThreadReply(queryClient: QueryClient, threadId: string, reply: RealtimeMessage) {
  const normalized = toMessageWithCount(reply);

  queryClient.setQueryData<ThreadMessages>(threadMessagesKey(threadId), (old) => {
    if (!old || old.parent.id !== threadId) return old;

    if (old.messages.some((message) => message.id === normalized.id)) {
      return old;
    }

    return { ...old, messages: [...old.messages, normalized] };
  });
}

export function reconcileThreadReply(
  queryClient: QueryClient,
  threadId: string,
  tempId: string,
  reply: RealtimeMessage
) {
  const normalized = toMessageWithCount(reply);

  queryClient.setQueryData<ThreadMessages>(threadMessagesKey(threadId), (old) => {
    if (!old) return old;

    return { ...old, messages: replaceAndDedupe(old.messages, tempId, normalized) };
  });
}

export function updateChannelMessage(
  queryClient: QueryClient,
  channelId: string,
  messageId: string,
  updater: (message: RealtimeMessage) => RealtimeMessage
) {
  queryClient.setQueryData<InfiniteMessages>(messageListInfiniteKey(channelId), (old) => {
    if (!old) return old;

    const pages = updateMessageInPages(old.pages, messageId, updater);
    return pages ? { ...old, pages } : old;
  });
}

export function updateThreadMessage(
  queryClient: QueryClient,
  threadId: string,
  messageId: string,
  updater: (message: MessageWithCount) => MessageWithCount
) {
  queryClient.setQueryData<ThreadMessages>(threadMessagesKey(threadId), (old) => {
    if (!old) return old;

    let changed = false;

    const apply = (message: MessageWithCount) => {
      if (message.id !== messageId) return message;

      changed = true;
      return updater(message);
    };

    const parent = apply(old.parent);
    const messages = old.messages.map(apply);

    return changed ? { ...old, parent, messages } : old;
  });
}

export function setMessageReactions(
  queryClient: QueryClient,
  {
    channelId,
    threadId,
    messageId,
    messageReactions,
  }: { channelId: string; threadId: string | null; messageId: string; messageReactions: Reaction[] }
) {
  updateChannelMessage(queryClient, channelId, messageId, (message) => ({ ...message, messageReactions }));

  if (threadId) {
    updateThreadMessage(queryClient, threadId, messageId, (message) => ({ ...message, messageReactions }));
  }
}

export function toggleMessageReaction(
  queryClient: QueryClient,
  {
    channelId,
    threadId,
    messageId,
    emoji,
    userId,
  }: { channelId: string; threadId: string | null; messageId: string; emoji: string; userId: string }
) {
  const toggle = (reactions: Reaction[] | undefined) => {
    const list = reactions ?? [];
    const reacted = list.some((reaction) => reaction.emoji === emoji && reaction.userId === userId);

    return reacted
      ? list.filter((reaction) => !(reaction.emoji === emoji && reaction.userId === userId))
      : [...list, { emoji, userId }];
  };

  updateChannelMessage(queryClient, channelId, messageId, (message) => ({
    ...message,
    messageReactions: toggle(message.messageReactions),
  }));

  if (threadId) {
    updateThreadMessage(queryClient, threadId, messageId, (message) => ({
      ...message,
      messageReactions: toggle(message.messageReactions),
    }));
  }
}

export function incrementReplyCount(queryClient: QueryClient, channelId: string, messageId: string, delta: number) {
  updateChannelMessage(queryClient, channelId, messageId, (message) => ({
    ...message,
    _count: { replies: Math.max(0, (message._count?.replies ?? 0) + delta) },
  }));
}
