"use client";

import { createMessageSchema, CreateMessageSchemaType } from "@/app/schemas/message";
import { Field, FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "../message/MessageComposer";
import { useAttachmentUpload } from "@/hooks/use-attachement-upload";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { InfiniteMessages, messageListInfiniteKey, threadMessagesKey } from "@/lib/query/message-keys";
import {
  appendThreadReply,
  buildOptimisticMessage,
  incrementReplyCount,
  reconcileThreadReply,
  type ThreadMessages,
} from "@/lib/query/message-cache";
import { getAvatar } from "@/lib/getAvatar";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { toast } from "sonner";

type ThreadReplyFormProps = {
  threadId: string;
};

export function ThreadReplyForm({ threadId }: ThreadReplyFormProps) {
  const params = useParams<{ workspaceId: string; channelId: string }>();
  const channelId = params.channelId;

  const {
    data: { user },
  } = useSuspenseQuery(orpc.workspace.list.queryOptions());

  const upload = useAttachmentUpload();
  const [editorKey, setEditorKey] = useState(0);

  const queryClient = useQueryClient();
  const { sendEvent } = useChannelRealtime();

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      content: "",
      channelId,
      threadId,
    },
  });

  useEffect(() => {
    form.setValue("threadId", threadId);
  }, [form, threadId]);

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (variables) => {
        const channelKey = messageListInfiniteKey(channelId);
        const threadKey = threadMessagesKey(threadId);

        await Promise.all([
          queryClient.cancelQueries({ queryKey: channelKey }),
          queryClient.cancelQueries({ queryKey: threadKey }),
        ]);

        const previousChannel = queryClient.getQueryData<InfiniteMessages>(channelKey);
        const previousThread = queryClient.getQueryData<ThreadMessages>(threadKey);

        const tempId = `optimistic-${crypto.randomUUID()}`;

        appendThreadReply(
          queryClient,
          threadId,
          buildOptimisticMessage({
            id: tempId,
            content: variables.content,
            imageUrl: variables.imageUrl ?? null,
            channelId,
            threadId,
            authorId: user.id,
            authorEmail: user.email,
            authorName: user.given_name ?? user.email,
            authorAvatarUrl: getAvatar({ email: user.email, picture: user.picture }),
          })
        );

        incrementReplyCount(queryClient, channelId, threadId, 1);

        return { previousChannel, previousThread, channelKey, threadKey, tempId };
      },
      onError: (_error, _variables, context) => {
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

        toast.error("Failed to send message. Please try again.");
      },
      onSuccess: (data, _variables, context) => {
        form.reset({
          content: "",
          channelId,
          threadId,
        });
        upload.clearStagedAttachment();
        setEditorKey((prev) => prev + 1);

        if (context) {
          reconcileThreadReply(queryClient, threadId, context.tempId, data);
        }

        sendEvent({ type: "thread:reply:created", payload: { message: { ...data, threadId } } });

        toast.success("Message sent successfully!");
      },
    })
  );

  const onSubmit = (data: CreateMessageSchemaType) => {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stagedAttachment?.url ?? undefined,
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
              <MessageComposer
                key={editorKey} // to reset editor state
                value={field.value}
                onChange={field.onChange}
                onSubmit={form.handleSubmit(onSubmit)}
                upload={upload}
                isSubmitting={createMessageMutation.isPending}
              />
              {fieldState.error && <div className="text-xs text-destructive mt-1">{fieldState.error.message}</div>}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
