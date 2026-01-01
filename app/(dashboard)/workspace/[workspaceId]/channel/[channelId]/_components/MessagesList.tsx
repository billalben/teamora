"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { MessageItem } from "./message/MessageItem";
import { orpc } from "@/lib/orpc";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

export function MessagesList() {
  const params = useParams<{ channelId: string }>();

  const hasInitialScrolledRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const infinteOptions = orpc.message.list.infiniteOptions({
    input: (pageParam: string | undefined) => ({
      channelId: params.channelId,
      cursor: pageParam,
      limit: 25,
    }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: [...data.pages]
        .map((page) => ({
          ...page,
          items: [...page.items].reverse(),
        }))
        .reverse(),
      pageParams: [...data.pageParams].reverse(),
      // items: data.pages.flatMap((page) => page.items),
    }),
  });

  const query = useInfiniteQuery({
    ...infinteOptions,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.items) ?? [];
  }, [query.data]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop <= 80 && query.hasNextPage && !query.isFetchingNextPage) {
      // console.log("Fetching next page...");

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
      }
    }
  }, [query.data?.pages.length]);

  return (
    <div className="relative h-full">
      {query.isFetchingNextPage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-card border border-input rounded-full text-sm text-muted-foreground shadow-md">
          Loading more messages...
        </div>
      )}

      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4">
        {items?.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>

      {/* TODO: new messages button to scroll bottom */}
    </div>
  );
}
