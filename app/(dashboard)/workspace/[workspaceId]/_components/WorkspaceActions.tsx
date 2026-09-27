"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LogOutIcon, MoreHorizontalIcon, UserPlusIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpc } from "@/lib/orpc";
import { getWorkspaceDepartureHref } from "@/lib/workspace";
import { isWorkspaceAdmin } from "@/app/schemas/member";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { InviteMember } from "./member/InviteMember";

export function WorkspaceActions() {
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const queryClient = useQueryClient();
  const { sendEvent } = useWorkspaceRealtime();

  const { data: members } = useQuery(orpc.workspace.member.list.queryOptions());
  const { data: workspaceData } = useQuery(orpc.workspace.list.queryOptions());

  const currentUserId = workspaceData?.user?.id ?? null;
  const currentMember = members?.find((member) => member.id === currentUserId);
  const isAdmin = isWorkspaceAdmin(currentMember?.roles);
  const adminCount = members?.filter((member) => isWorkspaceAdmin(member.roles)).length ?? 0;
  const isLastAdmin = isAdmin && adminCount <= 1;

  const remainingOrgCodes = useMemo(
    () => (workspaceData?.workspaces ?? []).map((workspace) => workspace.id),
    [workspaceData]
  );

  const leaveMutation = useMutation(
    orpc.workspace.member.leave.mutationOptions({
      onSuccess: () => {
        setOpen(false);
        toast.success("You left the workspace.");

        if (currentUserId) {
          sendEvent({ type: "member:left", payload: { userId: currentUserId } });
        }

        queryClient.invalidateQueries({ queryKey: orpc.workspace.member.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });

        window.location.assign(getWorkspaceDepartureHref({ leftOrgCode: workspaceId, remainingOrgCodes }));
      },
      onError: (error) => {
        setOpen(false);
        toast.error(error.message);
      },
    })
  );

  const handleOpenChange = (next: boolean) => {
    if (!next && leaveMutation.isPending) {
      return;
    }

    setOpen(next);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8" aria-label="Workspace actions">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end" className="w-52">
          {isAdmin && (
            <>
              <DropdownMenuItem closeOnClick onClick={() => setInviteOpen(true)}>
                <UserPlusIcon />
                Add member
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem variant="destructive" closeOnClick disabled={isLastAdmin} onClick={() => setOpen(true)}>
            <LogOutIcon />
            Leave workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isAdmin && <InviteMember open={inviteOpen} onOpenChange={setInviteOpen} />}

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this workspace and all of its channels. You can only rejoin if someone invites you
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
