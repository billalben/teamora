"use client";

import { createMessageSchema, CreateMessageSchemaType } from "@/app/schemas/message";
import { Field, FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "../message/MessageComposer";
import { useAttachmentUpload } from "@/hooks/use-attachement-upload";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { appendThreadReply } from "@/lib/query/message-cache";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { toast } from "sonner";

interface IAppProps {
  threadId: string;
}

export default function ThreadReplyForm({ threadId }: IAppProps) {
  const params = useParams<{ workspaceId: string; channelId: string }>();
  const channelId = params.channelId;

  const upload = useAttachmentUpload();
  const [editorKey, setEditorKey] = useState(0);

  const queryClient = useQueryClient();
  const { send } = useChannelRealtime();

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
      onSuccess: (data) => {
        form.reset({
          content: "",
          channelId,
          threadId,
        });
        upload.clearStagedAttachment();
        setEditorKey((prev) => prev + 1);

        appendThreadReply(queryClient, threadId, data);

        send({ type: "message:created", payload: { message: data } });
        send({ type: "message:replies:increment", payload: { messageId: threadId, delta: 1 } });

        toast.success("Message sent successfully!");
      },
      onError: () => {
        toast.error("Failed to send message. Please try again.");
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
