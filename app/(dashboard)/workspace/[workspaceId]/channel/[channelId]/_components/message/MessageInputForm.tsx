"use client";

import { createMessageSchema, type CreateMessageSchemaType } from "@/app/schemas/message";
import { type RealtimeMessage } from "@/app/schemas/realtime";
import { Field, FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "./MessageComposer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { InfiniteMessages, messageListInfiniteKey } from "@/lib/query/message-keys";
import { getAvatar } from "@/lib/getAvatar";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachement-upload";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";

interface IAppProps {
  channelId: string;
  user: KindeUser<Record<string, unknown>> | undefined;
}

export function MessageInputForm({ channelId, user }: IAppProps) {
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const { send } = useChannelRealtime();

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

        const optimisticMessage: RealtimeMessage = {
          id: tempId,
          content: variables.content,
          imageUrl: variables.imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user?.id ?? "",
          authorEmail: user?.email ?? null,
          authorName: user?.given_name ?? user?.email ?? null,
          authorAvatarUrl: getAvatar({ email: user?.email, picture: user?.picture }),
          channelId: variables.channelId,
          threadId: variables.threadId ?? null,
          messageReactions: [],
          _count: { replies: 0 },
        };

        queryClient.setQueryData<InfiniteMessages>(queryKey, (old) => {
          if (!old) {
            return {
              pages: [{ items: [optimisticMessage], nextCursor: null }],
              pageParams: [undefined],
            };
          }

          const first = old.pages[0];

          const updatedFirst = {
            ...first,
            items: [optimisticMessage, ...first.items],
          };

          return {
            ...old,
            pages: [updatedFirst, ...old.pages.slice(1)],
          };
        });

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
      onSuccess: (data, _variables, context) => {
        form.reset({ channelId, content: "" });
        upload.clearStagedAttachment();
        setEditorKey((prev) => prev + 1);

        // replace the optimistic message with the persisted one
        if (context) {
          queryClient.setQueryData<InfiniteMessages>(context.queryKey, (old) => {
            if (!old) return old;

            const pages = old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => (item.id === context.tempId ? data : item)),
            }));

            return { ...old, pages };
          });
        }

        send({ type: "message:created", payload: { message: data } });

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
