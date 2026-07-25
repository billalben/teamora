"use client";
import { useState } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";
import { useParams, useRouter } from "next/navigation";

export function CreateNewChannel() {
  const queryClient = useQueryClient();

  const [openDialog, setOpenDialog] = useState(false);

  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();

  const form = useForm<ChannelNameSchemaType>({
    resolver: zodResolver(channelNameSchema),
    defaultValues: { name: "" },
  });

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess: (newChannel) => {
        toast.success(`Channel ${newChannel.name} created successfully`);

        queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey(),
        });

        form.reset();
        setOpenDialog(false);

        router.push(`/workspace/${params.workspaceId}/channel/${newChannel.id}`);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create channel due to an unexpected error.");
        }
        setOpenDialog(false);
      },
    })
  );

  const handleModalChange = (isOpen: boolean) => {
    if (!isOpen && createChannelMutation.isPending) {
      // Prevent closing the dialog while mutation is in progress
      return;
    }

    setOpenDialog(isOpen);
  };

  const onSubmit = (values: ChannelNameSchemaType) => {
    createChannelMutation.mutate(values);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleModalChange}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full">
            <PlusIcon className="size-4" />
            Add Channel
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Channel</DialogTitle>
          <DialogDescription>Create a new channel to collaborate with your team members.</DialogDescription>
        </DialogHeader>
        <form id="form-create-channel" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => {
                // Calculate transformed name here, using field.value
                const transformedName = field.value ? transformChannelName(field.value) : "";

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-create-channel-name">Channel Name</FieldLabel>
                    <Input
                      {...field}
                      id="form-create-channel-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="My New Channel"
                      autoComplete="off"
                      disabled={createChannelMutation.isPending}
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
              onClick={() => handleModalChange(false)}
              disabled={createChannelMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" form="form-create-channel" disabled={createChannelMutation.isPending}>
              {createChannelMutation.isPending ? "Creating..." : "Create Channel"}
            </Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
