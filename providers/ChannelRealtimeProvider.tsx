import { RealtimeEvent, RealtimeEventSchema } from "@/app/schemas/realtime";
import {
  appendThreadReply,
  incrementReplyCount,
  setMessageReactions,
  updateChannelMessage,
  updateThreadMessage,
  upsertChannelMessage,
  type MessageWithCount,
} from "@/lib/query/message-cache";
import { useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { env } from "@/lib/env";

type ChannelRealtimeContextValue = {
  sendEvent: (event: RealtimeEvent) => void;
};

type ChannelRealtimeProviderProps = {
  channelId: string;
  children: ReactNode;
};

const ChannelRealtimeContext = createContext<ChannelRealtimeContextValue | null>(null);

export function ChannelRealtimeProvider({ channelId, children }: ChannelRealtimeProviderProps) {
  const queryClient = useQueryClient();

  const socket = usePartySocket({
    host: env.NEXT_PUBLIC_PARTYKIT_HOST,
    room: `channel-${channelId}`,
    party: "chat",

    onMessage(event) {
      try {
        const result = RealtimeEventSchema.safeParse(JSON.parse(event.data));

        if (!result.success) {
          console.warn("invalid channel event");
          return;
        }

        const realtimeEvent = result.data;

        switch (realtimeEvent.type) {
          case "message:created": {
            upsertChannelMessage(queryClient, channelId, realtimeEvent.payload.message);
            break;
          }

          case "thread:reply:created": {
            const { message } = realtimeEvent.payload;

            appendThreadReply(queryClient, message.threadId, message);
            incrementReplyCount(queryClient, channelId, message.threadId, 1);
            break;
          }

          case "message:updated": {
            const { message } = realtimeEvent.payload;

            updateChannelMessage(queryClient, channelId, message.id, (current) => ({ ...current, ...message }));
            updateThreadMessage(
              queryClient,
              message.threadId ?? message.id,
              message.id,
              (current) => ({ ...current, ...message }) as MessageWithCount
            );
            break;
          }

          case "reaction:updated": {
            const { messageId, threadId, messageReactions } = realtimeEvent.payload;

            setMessageReactions(queryClient, { channelId, threadId, messageId, messageReactions });
            break;
          }
        }
      } catch (error) {
        console.error("failed to parse message: ", error);
      }
    },
  });

  const value = useMemo<ChannelRealtimeContextValue>(() => {
    return {
      sendEvent: (event) => {
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
