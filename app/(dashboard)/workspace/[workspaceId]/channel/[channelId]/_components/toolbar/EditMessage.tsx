"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { updateMessageSchema, UpdateMessageSchemaType } from "@/app/schemas/message";
import { Field, FieldGroup } from "@/components/ui/field";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { InfiniteMessages, messageListInfiniteKey, threadMessagesKey } from "@/lib/query/message-keys";
import { updateChannelMessage, updateThreadMessage, type ThreadMessages } from "@/lib/query/message-cache";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { toast } from "sonner";
import { Message } from "@/lib/generated/prisma/client";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { AttachmentChip } from "../message/AttachmentChip";

type EditMessageProps = {
  message: Message;
  onCancel: () => void;
  onSave: () => void;
};

export function EditMessage({ message, onCancel, onSave }: EditMessageProps) {
  const queryClient = useQueryClient();
  const { sendEvent } = useChannelRealtime();
  const [imageRemoved, setImageRemoved] = useState(false);

  const form = useForm<UpdateMessageSchemaType>({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: { messageId: message.id, content: message.content },
  });

  const updateMessageMutation = useMutation(
    orpc.message.update.mutationOptions({
      onMutate: async (variables) => {
        if (!message.channelId) return undefined;

        const channelKey = messageListInfiniteKey(message.channelId);
        const threadKey = threadMessagesKey(message.threadId ?? message.id);

        await Promise.all([
          queryClient.cancelQueries({ queryKey: channelKey }),
          queryClient.cancelQueries({ queryKey: threadKey }),
        ]);

        const previousChannel = queryClient.getQueryData<InfiniteMessages>(channelKey);
        const previousThread = queryClient.getQueryData<ThreadMessages>(threadKey);

        const updatedAt = new Date();

        updateChannelMessage(queryClient, message.channelId, message.id, (current) => ({
          ...current,
          content: variables.content,
          ...(variables.imageUrl !== undefined ? { imageUrl: variables.imageUrl } : {}),
          updatedAt,
        }));
        updateThreadMessage(queryClient, message.threadId ?? message.id, message.id, (current) => ({
          ...current,
          content: variables.content,
          ...(variables.imageUrl !== undefined ? { imageUrl: variables.imageUrl } : {}),
          updatedAt,
        }));

        return { previousChannel, previousThread, channelKey, threadKey };
      },
      onError: (error, _variables, context) => {
        if (context) {
          if (context.previousChannel) {
            queryClient.setQueryData(context.channelKey, context.previousChannel);
          } else {
            queryClient.removeQueries({ queryKey: context.channelKey });
          }

          if (context.previousThread) {
            queryClient.setQueryData(context.threadKey, context.previousThread);
          } else {
            queryClient.removeQueries({ queryKey: context.threadKey });
          }
        }

        toast.error(error.message);
      },
      onSuccess: (updated) => {
        const updatedMessage = updated.message;

        if (message.channelId) {
          updateChannelMessage(queryClient, message.channelId, updatedMessage.id, (current) => ({
            ...current,
            ...updatedMessage,
          }));
          updateThreadMessage(queryClient, message.threadId ?? message.id, updatedMessage.id, (current) => ({
            ...current,
            ...updatedMessage,
          }));
        }

        sendEvent({ type: "message:updated", payload: { message: updatedMessage } });

        toast.success("Message updated successfully");
        onSave();
      },
    })
  );

  const onSubmit = (data: UpdateMessageSchemaType) => {
    updateMessageMutation.mutate({
      ...data,
      ...(message.imageUrl && imageRemoved ? { imageUrl: null } : {}),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <RichTextEditor
                field={field}
                footerLeft={
                  message.imageUrl && !imageRemoved ? (
                    <AttachmentChip url={message.imageUrl} onRemoveImage={() => setImageRemoved(true)} />
                  ) : undefined
                }
                sendButton={
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={onCancel}
                      disabled={updateMessageMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      {updateMessageMutation.isPending ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                }
              />
              {fieldState.error && <div className="text-xs text-destructive mt-1">{fieldState.error.message}</div>}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
