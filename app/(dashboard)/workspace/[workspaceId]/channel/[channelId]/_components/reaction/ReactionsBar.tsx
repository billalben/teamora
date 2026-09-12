"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmojiReaction } from "./EmojiReaction";
import { orpc } from "@/lib/orpc";
import { patchMessageReactions } from "@/lib/query/message-cache";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { toast } from "sonner";
import { GroupReactionSchemaType } from "@/app/schemas/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface iAppProps {
  messageId: string;
  reactions: GroupReactionSchemaType[];
  context: { type: "thread" | "channel"; threadId: string };
}

export function ReactionsBar({ messageId, reactions }: iAppProps) {
  const queryClient = useQueryClient();
  const { send } = useChannelRealtime();

  const toggleReactionMutation = useMutation(
    orpc.message.reaction.toggle.mutationOptions({
      onSuccess: (data) => {
        patchMessageReactions(queryClient, data.messageId, data.messageReactions);

        send({
          type: "reaction:updated",
          payload: { messageId: data.messageId, messageReactions: data.messageReactions },
        });

        toast.success("Reaction added");
      },
      onError: () => {
        toast.error("Failed to add reaction");
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
