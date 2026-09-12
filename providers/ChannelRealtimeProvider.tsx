import { ChannelEvent, ChannelEventSchema } from "@/app/schemas/realtime";
import {
  appendThreadReply,
  incrementReplyCount,
  patchMessageReactions,
  replaceChannelMessage,
  replaceThreadMessage,
  upsertChannelMessage,
} from "@/lib/query/message-cache";
import { useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { env } from "@/lib/env";

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
    host: env.NEXT_PUBLIC_PARTYKIT_HOST,
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

          if (raw.threadId) {
            appendThreadReply(queryClient, raw.threadId, raw);
          } else {
            upsertChannelMessage(queryClient, channelId, raw);
          }

          return;
        }

        if (evt.type === "message:updated") {
          const raw = evt.payload.message;

          replaceChannelMessage(queryClient, channelId, raw);
          replaceThreadMessage(queryClient, raw);

          return;
        }

        if (evt.type === "reaction:updated") {
          patchMessageReactions(queryClient, evt.payload.messageId, evt.payload.messageReactions);

          return;
        }

        if (evt.type === "message:replies:increment") {
          incrementReplyCount(queryClient, evt.payload.messageId, evt.payload.delta);

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
