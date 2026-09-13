"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { EmojiReaction } from "./EmojiReaction";
import { orpc } from "@/lib/orpc";
import { InfiniteMessages, messageListInfiniteKey, threadMessagesKey } from "@/lib/query/message-keys";
import { setMessageReactions, toggleMessageReaction, type ThreadMessages } from "@/lib/query/message-cache";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { toast } from "sonner";
import { GroupReactionSchemaType } from "@/app/schemas/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReactionsBarProps = {
  messageId: string;
  userId: string;
  reactions: GroupReactionSchemaType[];
  context: { type: "thread" | "channel"; threadId: string };
};

export function ReactionsBar({ messageId, userId, reactions, context }: ReactionsBarProps) {
  const params = useParams<{ channelId: string }>();
  const channelId = params.channelId;

  const queryClient = useQueryClient();
  const { sendEvent } = useChannelRealtime();

  const threadId = context.type === "thread" ? context.threadId : null;

  const toggleReactionMutation = useMutation(
    orpc.message.reaction.toggle.mutationOptions({
      onMutate: async (variables) => {
        const channelKey = messageListInfiniteKey(channelId);
        const threadKey = threadId ? threadMessagesKey(threadId) : null;

        await Promise.all([
          queryClient.cancelQueries({ queryKey: channelKey }),
          threadKey ? queryClient.cancelQueries({ queryKey: threadKey }) : Promise.resolve(),
        ]);

        const previousChannel = queryClient.getQueryData<InfiniteMessages>(channelKey);
        const previousThread = threadKey ? queryClient.getQueryData<ThreadMessages>(threadKey) : undefined;

        toggleMessageReaction(queryClient, {
          channelId,
          threadId,
          messageId: variables.messageId,
          emoji: variables.emoji,
          userId,
        });

        return { previousChannel, previousThread, channelKey, threadKey };
      },
      onError: (_error, _variables, context_) => {
        if (context_) {
          if (context_.previousChannel) {
            queryClient.setQueryData(context_.channelKey, context_.previousChannel);
          } else {
            queryClient.removeQueries({ queryKey: context_.channelKey });
          }

          if (context_.threadKey) {
            if (context_.previousThread) {
              queryClient.setQueryData(context_.threadKey, context_.previousThread);
            } else {
              queryClient.removeQueries({ queryKey: context_.threadKey });
            }
          }
        }

        toast.error("Failed to update reaction");
      },
      onSuccess: (data, variables) => {
        setMessageReactions(queryClient, {
          channelId,
          threadId,
          messageId: data.messageId,
          messageReactions: data.messageReactions,
        });

        sendEvent({
          type: "reaction:updated",
          payload: {
            messageId: data.messageId,
            threadId,
            messageReactions: data.messageReactions,
          },
        });

        toast.success(
          data.messageReactions.some((reaction) => reaction.emoji === variables.emoji && reaction.userId === userId)
            ? "Reaction added"
            : "Reaction removed"
        );
      },
    })
  );

  const handleEmojiSelect = (emoji: string) => {
    toggleReactionMutation.mutate({
      messageId: messageId,
      emoji: emoji,
    });
  };

  return (
    <div className="mt-1 flex items-center gap-1">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          type="button"
          className={cn(
            "flex items-center gap-2 text-xs",
            reaction.reactedByMe && "bg-primary/10 border border-primary/20"
          )}
          onClick={() => handleEmojiSelect(reaction.emoji)}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="text-sm">{reaction.count}</span>
        </Button>
      ))}

      <EmojiReaction onSelectEmoji={handleEmojiSelect} />
    </div>
  );
}
