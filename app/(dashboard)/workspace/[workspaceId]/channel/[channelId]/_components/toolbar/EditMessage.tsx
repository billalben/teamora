"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { updateMessageSchema, UpdateMessageSchemaType } from "@/app/schemas/message";
import { Field, FieldGroup } from "@/components/ui/field";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { Message } from "@/lib/generated/prisma/client";
import { Loader2Icon } from "lucide-react";

type TProps = {
  message: Message;
  onCancel: () => void;
  onSave: () => void;
};

export function EditMessage({ message, onCancel, onSave }: TProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateMessageSchemaType>({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: { messageId: message.id, content: message.content },
  });

  const updateMessageMutation = useMutation(
    orpc.message.update.mutationOptions({
      onSuccess: (updated) => {
        type TMessagePage = { items: Message[]; nextCursor?: string };
        type TInfiniteMessages = InfiniteData<TMessagePage>;

        queryClient.setQueryData<TInfiniteMessages>(["message.list", message.channelId], (old) => {
          if (!old) return old;

          const updatedMessage = updated.message;

          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === updatedMessage.id ? { ...item, ...updatedMessage } : item)),
          }));

          return {
            ...old,
            pages,
          };
        });

        toast.success("Message updated successfully");
        onSave();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const onSubmit = (data: UpdateMessageSchemaType) => {
    updateMessageMutation.mutate(data);
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
