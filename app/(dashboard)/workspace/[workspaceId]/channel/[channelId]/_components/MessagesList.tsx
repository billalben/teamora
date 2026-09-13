"use client";

import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { MessageItem } from "./message/MessageItem";
import { orpc } from "@/lib/orpc";
import { MESSAGE_PAGE_SIZE, messageListInfiniteKey } from "@/lib/query/message-keys";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ChevronDown, MessageCircleOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

const SCROLL_THRESHOLD_PX = 80;

function isNearBottom(el: HTMLDivElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD_PX;
}

export function MessagesList() {
  const params = useParams<{ channelId: string }>();

  const hasInitialScrolledRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevLastMessageIdRef = useRef<string | undefined>(undefined);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const infinteOptions = orpc.message.list.infiniteOptions({
    input: (pageParam: string | undefined) => ({
      channelId: params.channelId,
      cursor: pageParam,
      limit: MESSAGE_PAGE_SIZE,
    }),
    initialPageParam: undefined,
    queryKey: messageListInfiniteKey(params.channelId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: [...data.pages]
        .map((page) => ({
          ...page,
          items: [...page.items].reverse(),
        }))
        .reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  const query = useInfiniteQuery({
    ...infinteOptions,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const {
    data: { user },
  } = useSuspenseQuery(orpc.workspace.list.queryOptions());

  const items = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.items) ?? [];
  }, [query.data]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollTo({ top: el.scrollHeight, behavior });
    setHasNewMessages(false);
    setIsAtBottom(true);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const atBottom = isNearBottom(el);
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasNewMessages(false);
    }

    if (el.scrollTop <= SCROLL_THRESHOLD_PX && query.hasNextPage && !query.isFetchingNextPage) {
      const previousScrollHeight = el.scrollHeight;
      const previousScrollTop = el.scrollTop;
      query.fetchNextPage().then(() => {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
      });
    }
  };

  useEffect(() => {
    if (query.data?.pages.length && !hasInitialScrolledRef.current) {
      const el = scrollRef.current;

      if (el) {
        el.scrollTop = el.scrollHeight;
        hasInitialScrolledRef.current = true;
        prevLastMessageIdRef.current = items[items.length - 1]?.id;
      }
    }
  }, [query.data?.pages.length, items]);

  // New message at the bottom: auto-scroll if pinned, else show "New messages"
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    const lastId = items[items.length - 1]?.id;
    const prevLastId = prevLastMessageIdRef.current;

    if (prevLastId && lastId && lastId !== prevLastId) {
      if (isNearBottom(el)) {
        el.scrollTop = el.scrollHeight;
        queueMicrotask(() => {
          setHasNewMessages(false);
          setIsAtBottom(true);
        });
      } else {
        queueMicrotask(() => {
          setHasNewMessages(true);
          setIsAtBottom(false);
        });
      }
    }

    prevLastMessageIdRef.current = lastId;
  }, [items]);

  const showNewMessagesButton = !isAtBottom && hasNewMessages;

  return (
    <div className="relative h-full">
      {query.isFetchingNextPage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-card border border-input rounded-full text-sm text-muted-foreground shadow-md">
          Loading more messages...
        </div>
      )}

      {items.length === 0 ? (
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircleOffIcon className="size-16 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No messages yet.</EmptyTitle>
            <EmptyDescription>Send a message to get things started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 flex flex-col gap-4">
          {items.map((message) => (
            <MessageItem key={message.id} message={message} user={user} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNewMessagesButton && (
          <motion.div
            key="new-messages"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute bottom-4 end-10 z-10"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 4px 14px rgb(0 0 0 / 0.12)",
                  "0 6px 20px rgb(0 0 0 / 0.18)",
                  "0 4px 14px rgb(0 0 0 / 0.12)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="rounded-md"
            >
              <Button type="button" size="sm" className="gap-2 pr-3 shadow-none" onClick={() => scrollToBottom()}>
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/50" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                </span>
                New messages
                <motion.span
                  aria-hidden
                  animate={{ y: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                  className="inline-flex"
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
