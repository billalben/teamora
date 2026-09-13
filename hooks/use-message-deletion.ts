"use client";

import {
  setMessageDeleted,
  updateChannelMessage,
  updateThreadMessage,
  type MessageWithCount,
  type ThreadMessages,
} from "@/lib/query/message-cache";
import { InfiniteMessages, messageListInfiniteKey, threadMessagesKey } from "@/lib/query/message-keys";
import { orpc } from "@/lib/orpc";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type MessageLocation = {
  channelId: string;
  threadId: string | null;
  threadKey: ReturnType<typeof threadMessagesKey>;
  channelKey: ReturnType<typeof messageListInfiniteKey>;
};

function useMessageLocation(message: MessageWithCount): MessageLocation | null {
  if (!message.channelId) return null;

  return {
    channelId: message.channelId,
    threadId: message.threadId ?? null,
    threadKey: threadMessagesKey(message.threadId ?? message.id),
    channelKey: messageListInfiniteKey(message.channelId),
  };
}

export function useDeleteMessage(message: MessageWithCount) {
  const queryClient = useQueryClient();
  const { sendEvent } = useChannelRealtime();
  const location = useMessageLocation(message);

  const mutation = useMutation(
    orpc.message.delete.mutationOptions({
      onMutate: async () => {
        if (!location) return undefined;

        await Promise.all([
          queryClient.cancelQueries({ queryKey: location.channelKey }),
          queryClient.cancelQueries({ queryKey: location.threadKey }),
        ]);

        const previousChannel = queryClient.getQueryData<InfiniteMessages>(location.channelKey);
        const previousThread = queryClient.getQueryData<ThreadMessages>(location.threadKey);

        setMessageDeleted(queryClient, {
          channelId: location.channelId,
          threadId: location.threadId,
          messageId: message.id,
        });

        return { previousChannel, previousThread };
      },
      onError: (error, _variables, context) => {
        if (location && context) {
          if (context.previousChannel) {
            queryClient.setQueryData(location.channelKey, context.previousChannel);
          } else {
            queryClient.removeQueries({ queryKey: location.channelKey });
          }

          if (context.previousThread) {
            queryClient.setQueryData(location.threadKey, context.previousThread);
          } else {
            queryClient.removeQueries({ queryKey: location.threadKey });
          }
        }

        toast.error(error.message);
      },
      onSuccess: (deleted) => {
        sendEvent({ type: "message:deleted", payload: { message: deleted } });
        toast.success("Message deleted");
      },
    })
  );

  return {
    deleteMessage: () => mutation.mutate({ messageId: message.id }),
    isPending: mutation.isPending,
  };
}

export function useRestoreMessage(message: MessageWithCount) {
  const queryClient = useQueryClient();
  const { sendEvent } = useChannelRealtime();
  const location = useMessageLocation(message);

  const mutation = useMutation(
    orpc.message.restore.mutationOptions({
      onMutate: async () => {
        if (!location) return undefined;

        await Promise.all([
          queryClient.cancelQueries({ queryKey: location.channelKey }),
          queryClient.cancelQueries({ queryKey: location.threadKey }),
        ]);

        const previousChannel = queryClient.getQueryData<InfiniteMessages>(location.channelKey);
        const previousThread = queryClient.getQueryData<ThreadMessages>(location.threadKey);

        updateChannelMessage(queryClient, location.channelId, message.id, (current) => ({
          ...current,
          deletedAt: null,
        }));
        updateThreadMessage(queryClient, location.threadId ?? message.id, message.id, (current) => ({
          ...current,
          deletedAt: null,
        }));

        return { previousChannel, previousThread };
      },
      onError: (error, _variables, context) => {
        if (location && context) {
          if (context.previousChannel) {
            queryClient.setQueryData(location.channelKey, context.previousChannel);
          } else {
            queryClient.removeQueries({ queryKey: location.channelKey });
          }

          if (context.previousThread) {
            queryClient.setQueryData(location.threadKey, context.previousThread);
          } else {
            queryClient.removeQueries({ queryKey: location.threadKey });
          }
        }

        toast.error(error.message);
      },
      onSuccess: (restored) => {
        if (location) {
          updateChannelMessage(queryClient, location.channelId, restored.id, (current) => ({
            ...current,
            ...restored,
          }));
          updateThreadMessage(
            queryClient,
            location.threadId ?? restored.id,
            restored.id,
            (current) => ({ ...current, ...restored }) as MessageWithCount
          );
        }

        sendEvent({ type: "message:restored", payload: { message: restored } });
        toast.success("Message restored");
      },
    })
  );

  return {
    restoreMessage: () => mutation.mutate({ messageId: message.id }),
    isPending: mutation.isPending,
  };
}
