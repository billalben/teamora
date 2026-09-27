"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { channelNameSchema, transformChannelName, type ChannelNameSchemaType } from "@/app/schemas/channel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";

type EditChannelProps = {
  channelId: string;
  channelName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function EditChannel({ channelId, channelName, open: openProp, onOpenChange, trigger }: EditChannelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const queryClient = useQueryClient();
  const { sendEvent } = useWorkspaceRealtime();

  const form = useForm<ChannelNameSchemaType>({
    resolver: zodResolver(channelNameSchema),
    defaultValues: { name: channelName },
  });

  const updateMutation = useMutation(
    orpc.channel.update.mutationOptions({
      onSuccess: (channel) => {
        toast.success(`Channel renamed to ${channel.name}`);
        sendEvent({ type: "channel:updated", payload: { channelId } });
        queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: orpc.channel.get.queryKey({ input: { channelId } }) });
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }

    onOpenChange?.(next);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && updateMutation.isPending) {
      return;
    }

    if (next) {
      form.reset({ name: channelName });
    }

    setOpen(next);
  };

  const onSubmit = (values: ChannelNameSchemaType) => {
    updateMutation.mutate({ channelId, name: values.name });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename channel</DialogTitle>
          <DialogDescription>Choose a new name for this channel.</DialogDescription>
        </DialogHeader>

        <form id="form-edit-channel" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => {
                const transformedName = field.value ? transformChannelName(field.value) : "";

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-edit-channel-name">Channel Name</FieldLabel>
                    <Input
                      {...field}
                      id="form-edit-channel-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="my-channel"
                      autoComplete="off"
                      disabled={updateMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    {transformedName && transformedName !== field.value && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Suggested channel name: <strong>{transformedName}</strong>
                      </p>
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Field orientation="horizontal" className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" form="form-edit-channel" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
