"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmojiReaction } from "./EmojiReaction";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { GroupReactionSchemaType } from "@/app/schemas/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface iAppProps {
  messageId: string;
  reactions: GroupReactionSchemaType[];
  context: { type: "thread" | "channel"; threadId: string };
}

export function ReactionsBar({ messageId, reactions, context }: iAppProps) {
  const queryClient = useQueryClient();

  const toggleReactionMutation = useMutation(
    orpc.message.reaction.toggle.mutationOptions({
      onSuccess: () => {
        // Refresh the channel message list (covers main messages and the
        // parent of any open thread, since it shows reply counts).
        queryClient.invalidateQueries({
          queryKey: orpc.message.list.key(),
        });

        // When toggling a reaction inside a thread sidebar, also refresh
        // the thread query so the sidebar (parent + replies) updates.
        if (context.type === "thread") {
          queryClient.invalidateQueries({
            queryKey: orpc.message.thread.list.key({
              input: { messageId: context.threadId },
            }),
          });
        }

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
