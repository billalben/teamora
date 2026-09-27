"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type LeaveChannelProps = {
  channelId: string;
  channelName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function LeaveChannel({ channelId, channelName, open: openProp, onOpenChange, trigger }: LeaveChannelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();

  const leaveMutation = useMutation(
    orpc.channel.leave.mutationOptions({
      onSuccess: async () => {
        toast.success(`You left #${channelName}`);
        setOpen(false);

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
    if (!next && leaveMutation.isPending) {
      return;
    }

    setOpen(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger render={trigger} />}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave #{channelName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer see this channel. An admin can add you back later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={leaveMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={leaveMutation.isPending}
            onClick={() => leaveMutation.mutate({ channelId })}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {leaveMutation.isPending ? "Leaving..." : "Leave channel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
