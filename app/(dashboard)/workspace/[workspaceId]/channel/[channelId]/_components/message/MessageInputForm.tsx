"use client";

import { createMessageSchema, type CreateMessageSchemaType } from "@/app/schemas/message";
import { Field, FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "./MessageComposer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { InfiniteMessages, messageListInfiniteKey } from "@/lib/query/message-keys";
import { buildOptimisticMessage, reconcileChannelMessage, upsertChannelMessage } from "@/lib/query/message-cache";
import { getAvatar } from "@/lib/getAvatar";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachement-upload";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";

type MessageInputFormProps = {
  channelId: string;
  user: KindeUser<Record<string, unknown>> | undefined;
};

export function MessageInputForm({ channelId, user }: MessageInputFormProps) {
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const { sendEvent } = useChannelRealtime();

  const form = useForm<CreateMessageSchemaType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { channelId, content: "" },
  });

  // React Query
  const queryClient = useQueryClient();

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = messageListInfiniteKey(variables.channelId);

        await queryClient.cancelQueries({ queryKey });

        const previous = queryClient.getQueryData<InfiniteMessages>(queryKey);

        const tempId = `optimistic-${crypto.randomUUID()}`;

        upsertChannelMessage(
          queryClient,
          variables.channelId,
          buildOptimisticMessage({
            id: tempId,
            content: variables.content,
            imageUrl: variables.imageUrl ?? null,
            channelId: variables.channelId,
            threadId: variables.threadId ?? null,
            authorId: user?.id ?? "",
            authorEmail: user?.email ?? null,
            authorName: user?.given_name ?? user?.email ?? null,
            authorAvatarUrl: getAvatar({ email: user?.email, picture: user?.picture }),
          })
        );

        return { previous, queryKey, tempId };
      },
      onError: (_error, _variables, context) => {
        if (context) {
          if (context.previous) {
            queryClient.setQueryData(context.queryKey, context.previous);
          } else {
            queryClient.removeQueries({ queryKey: context.queryKey });
          }
        }

        return toast.error("Failed to send message. Please try again.");
      },
      onSuccess: (data, variables, context) => {
        form.reset({ channelId, content: "" });
        upload.clearStagedAttachment();
        setEditorKey((prev) => prev + 1);

        // swap the optimistic message for the persisted one
        if (context) {
          reconcileChannelMessage(queryClient, variables.channelId, context.tempId, data);
        }

        sendEvent({ type: "message:created", payload: { message: data } });

        return toast.success("Message sent successfully!");
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
    <form id="form-message-input" onSubmit={form.handleSubmit(onSubmit)}>
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
                isSubmitting={createMessageMutation.isPending}
                upload={upload}
              />
              {fieldState.error && <div className="text-xs text-destructive mt-1">{fieldState.error.message}</div>}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
