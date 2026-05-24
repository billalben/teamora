"use client";

import { createMessageSchema, type CreateMessageSchemaType } from "@/app/schemas/message";
import { Field, FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { MessageComposer } from "./MessageComposer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachement-upload";

interface IAppProps {
  channelId: string;
}

export function MessageInputForm({ channelId }: IAppProps) {
  const [editorKey, setEditorKey] = useState(0);
  const upload = useAttachmentUpload();

  const form = useForm<CreateMessageSchemaType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { channelId, content: "" },
  });

  // React Query
  const queryClient = useQueryClient();

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onSuccess: () => {
        form.reset({ channelId, content: "" });
        upload.clearStagedAttachment();
        setEditorKey((prev) => prev + 1);

        queryClient.invalidateQueries({
          queryKey: orpc.message.list.key(),
        });

        return toast.success("Message sent successfully!");
      },
      onError: () => {
        return toast.error("Failed to send message. Please try again.");
      },
    })
  );

  const onSubmit = (data: CreateMessageSchemaType) => {
    // console.log("data submitted: ", data);
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
