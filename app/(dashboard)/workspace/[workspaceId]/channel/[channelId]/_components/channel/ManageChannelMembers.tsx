"use client";

import { useMemo, useState } from "react";
import { CheckIcon, LockIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isWorkspaceAdmin } from "@/app/schemas/member";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";
import { toast } from "sonner";

type ManageChannelMembersProps = {
  channelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageChannelMembers({ channelId, open, onOpenChange }: ManageChannelMembersProps) {
  const queryClient = useQueryClient();
  const { sendEvent } = useWorkspaceRealtime();
  const [search, setSearch] = useState("");
  const [pendingUserIds, setPendingUserIds] = useState<string[] | null>(null);

  const { data: members } = useQuery(orpc.workspace.member.list.queryOptions());
  const { data: channelMembers } = useQuery(
    orpc.channel.member.list.queryOptions({ input: { channelId }, enabled: open })
  );

  const createdById = channelMembers?.createdById;
  const selectedUserIds = useMemo(
    () => new Set(pendingUserIds ?? channelMembers?.userIds ?? []),
    [pendingUserIds, channelMembers]
  );

  const updateMutation = useMutation(
    orpc.channel.member.update.mutationOptions({
      onSuccess: (_data, variables) => {
        toast.success("Channel members updated");
        sendEvent({ type: "channel:access:changed", payload: { channelId, userIds: variables.userIds } });
        queryClient.invalidateQueries({ queryKey: orpc.channel.member.list.queryKey({ input: { channelId } }) });
        queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });
        setPendingUserIds(null);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const filtered = (members ?? []).filter((member) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return member.full_name?.toLowerCase().includes(term) || member.email?.toLowerCase().includes(term);
  });

  const toggleMember = (userId: string) => {
    if (!userId) return;

    const next = new Set(selectedUserIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }

    setPendingUserIds([...next]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && updateMutation.isPending) {
      return;
    }

    if (!next) {
      setSearch("");
      setPendingUserIds(null);
    }

    onOpenChange(next);
  };

  const handleSave = () => {
    // Admins always have access and the creator is forced server-side, so only
    // submit toggleable (non-admin, non-creator) members.
    const userIds = [...selectedUserIds].filter((userId) => {
      if (userId === createdById) return false;

      const member = (members ?? []).find((candidate) => candidate.id === userId);

      return !isWorkspaceAdmin(member?.roles);
    });

    updateMutation.mutate({ channelId, userIds });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage channel members</DialogTitle>
          <DialogDescription>Choose which workspace members can access this channel.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="size-4 absolute left-3 top-0 translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search members..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="max-h-72 overflow-y-auto -mx-2 px-2">
          {filtered.map((member) => {
            const userId = member.id ?? "";
            const memberIsAdmin = isWorkspaceAdmin(member.roles);
            // Admins and the channel creator always keep access, so they can't be toggled.
            const isLocked = memberIsAdmin || userId === createdById;
            const selected = isLocked || selectedUserIds.has(userId);

            return (
              <button
                key={userId}
                type="button"
                disabled={isLocked}
                onClick={() => toggleMember(userId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                  isLocked ? "cursor-not-allowed opacity-70" : "hover:bg-accent"
                )}
              >
                <UserAvatar className="size-8" picture={member.picture} email={member.email} name={member.full_name} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>

                {isLocked && (
                  <span className="text-[11px] text-muted-foreground">
                    {memberIsAdmin ? "Admin" : "Creator"} — always has access
                  </span>
                )}

                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  )}
                >
                  {isLocked ? <LockIcon className="size-3" /> : selected && <CheckIcon className="size-3.5" />}
                </span>
              </button>
            );
          })}

          {filtered.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No members found.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || pendingUserIds === null}>
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
