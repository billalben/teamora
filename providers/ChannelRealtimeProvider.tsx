import { ChannelEvent, ChannelEventSchema } from "@/app/schemas/realtime";
import { InfiniteMessages, messageListInfiniteKey } from "@/lib/query/message-keys";
import { orpc } from "@/lib/orpc";
import { useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, ReactNode, useContext, useMemo } from "react";

type ChannelRealtimeContextValue = {
  send: (event: ChannelEvent) => void;
};

interface ChannelRealtimeProviderProps {
  channelId: string;
  children: ReactNode;
}

const ChannelRealtimeContext = createContext<ChannelRealtimeContextValue | null>(null);

export function ChannelRealtimeProvider({ channelId, children }: ChannelRealtimeProviderProps) {
  const queryClient = useQueryClient();

  const socket = usePartySocket({
    host: "http://localhost:8787",
    room: `channel-${channelId}`,
    party: "chat",

    onMessage(event) {
      try {
        const parsed = JSON.parse(event.data);

        const result = ChannelEventSchema.safeParse(parsed);

        if (!result.success) {
          console.warn("invalid channel event");
          return;
        }

        const evt = result.data;

        if (evt.type === "message:created") {
          const raw = evt.payload.message;

          // insert at top of first page of infinite list for the channnel
          queryClient.setQueryData<InfiniteMessages>(messageListInfiniteKey(channelId), (old) => {
            if (!old) {
              return {
                pages: [{ items: [raw], nextCursor: null }],
                pageParams: [undefined],
              };
            }

            // the sender may already have this message from an optimistic update
            if (old.pages.some((page) => page.items.some((message) => message.id === raw.id))) {
              return old;
            }

            const first = old.pages[0];

            const updatedFirst = {
              ...first,
              items: [raw, ...first.items],
            };

            return {
              ...old,
              pages: [updatedFirst, ...old.pages.slice(1)],
            };
          });

          return;
        }

        if (evt.type === "message:updated") {
          const raw = evt.payload.message;

          queryClient.setQueryData<InfiniteMessages>(messageListInfiniteKey(channelId), (old) => {
            if (!old) return old;

            let changed = false;

            const pages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
                if (item.id !== raw.id) return item;

                changed = true;
                // merge so realtime-stripped fields (messageReactions, _count) survive
                return { ...item, ...raw };
              }),
            }));

            return changed ? { ...old, pages } : old;
          });

          // the edited message may be the parent of an open thread sidebar
          queryClient.invalidateQueries({ queryKey: orpc.message.thread.list.key() });

          return;
        }
      } catch (error) {
        console.error("failed to parse message: ", error);
      }
    },
  });

  const value = useMemo<ChannelRealtimeContextValue>(() => {
    return {
      send: (event) => {
        socket.send(JSON.stringify(event));
      },
    };
  }, [socket]);

  return <ChannelRealtimeContext.Provider value={value}>{children}</ChannelRealtimeContext.Provider>;
}

export function useChannelRealtime(): ChannelRealtimeContextValue {
  const ctx = useContext(ChannelRealtimeContext);

  if (!ctx) {
    throw new Error("useChannelRealtime must be used within a channelRealtimeProvider");
  }

  return ctx;
}
