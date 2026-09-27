"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";

type DeleteChannelProps = {
  channelId: string;
  channelName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function DeleteChannel({ channelId, channelName, open: openProp, onOpenChange, trigger }: DeleteChannelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const [confirmation, setConfirmation] = useState("");
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const { sendEvent } = useWorkspaceRealtime();

  const canDelete = confirmation.trim() === channelName;

  const deleteMutation = useMutation(
    orpc.channel.delete.mutationOptions({
      onSuccess: async () => {
        toast.success(`Channel ${channelName} deleted`);
        sendEvent({ type: "channel:deleted", payload: { channelId } });
        setOpen(false);
        setConfirmation("");

        await queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });

        const next = queryClient.getQueryData<{ channels: { id: string }[] }>(orpc.channel.list.queryKey());
        const nextChannel = next?.channels.find((channel) => channel.id !== channelId);

        router.push(
          nextChannel
            ? `/workspace/${params.workspaceId}/channel/${nextChannel.id}`
            : `/workspace/${params.workspaceId}`
        );
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
    if (!next && deleteMutation.isPending) {
      return;
    }

    if (!next) {
      setConfirmation("");
    }

    setOpen(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger render={trigger} />}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete #{channelName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the channel and all of its messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Field data-invalid={confirmation.length > 0 && !canDelete}>
          <FieldLabel htmlFor="delete-channel-confirmation">
            Type <span className="font-semibold text-foreground">{channelName}</span> to confirm
          </FieldLabel>
          <Input
            id="delete-channel-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={channelName}
            autoComplete="off"
            disabled={deleteMutation.isPending}
          />
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={!canDelete || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ channelId })}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete channel"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
