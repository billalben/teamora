"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { MemberItem } from "./MemberItem";
import { MemberActivityFeed } from "./MemberActivityFeed";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkspaceRealtime } from "@/providers/WorkspaceRealtimeProvider";
import { organization_user } from "@kinde/management-api-js";
import { isWorkspaceAdmin } from "@/app/schemas/member";
import { toast } from "sonner";

type PendingAction = {
  type: "remove";
  member: organization_user;
};

export function MembersOverview() {
  const [searchMember, setSearchMember] = useState("");
  const debouncedMemberSearch = useDebounce(searchMember, 500);
  const trimLowercaseMemberSearch = debouncedMemberSearch.trim().toLowerCase();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const queryClient = useQueryClient();
  const { onlineUsers, sendEvent } = useWorkspaceRealtime();

  const handlePopoverOpen = (open: boolean) => {
    setSearchMember("");
    setIsPopoverOpen(open);
  };

  const { data: members, isError } = useQuery(orpc.workspace.member.list.queryOptions());
  const { data: activities } = useQuery(orpc.workspace.member.activity.queryOptions({ input: {} }));
  const { data: workspaceData } = useQuery(orpc.workspace.list.queryOptions());

  const currentUserId = workspaceData?.user?.id ?? null;
  const currentMember = members?.find((member) => member.id === currentUserId);
  const isCurrentUserAdmin = isWorkspaceAdmin(currentMember?.roles);
  const adminCount = members?.filter((member) => isWorkspaceAdmin(member.roles)).length ?? 0;

  const invalidateMemberQueries = () => {
    queryClient.invalidateQueries({ queryKey: orpc.workspace.member.list.queryKey() });
    queryClient.invalidateQueries({ queryKey: orpc.channel.list.queryKey() });
    queryClient.invalidateQueries({ queryKey: orpc.workspace.member.activity.queryKey({ input: {} }) });
  };

  const removeMutation = useMutation(
    orpc.workspace.member.remove.mutationOptions({
      onSuccess: (_data, variables) => {
        setPendingAction(null);
        toast.success("Member removed from the workspace.");
        sendEvent({ type: "member:removed", payload: { userId: variables.userId } });
        invalidateMemberQueries();
      },
      onError: (error) => {
        setPendingAction(null);
        toast.error(error.message);
      },
    })
  );

  const isActionPending = removeMutation.isPending;

  const filteredMembers = trimLowercaseMemberSearch
    ? members?.filter((member) => {
        const name = member.full_name?.toLowerCase();
        const email = member.email?.toLowerCase();

        return name?.includes(trimLowercaseMemberSearch) || email?.includes(trimLowercaseMemberSearch);
      })
    : members;

  const onlineUsersIds = useMemo(() => {
    return new Set(onlineUsers.map((user) => user.id));
  }, [onlineUsers]);

  const handleConfirmAction = () => {
    if (!pendingAction) {
      return;
    }

    removeMutation.mutate({ userId: pendingAction.member.id ?? "" });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !isActionPending) {
      setPendingAction(null);
    }
  };

  const targetName = pendingAction?.member.full_name ?? pendingAction?.member.email ?? "this person";

  if (isError) {
    return <p>error</p>;
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpen}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8" aria-label="Workspace members">
              <UsersIcon className="size-4" />
            </Button>
          }
        />

        <PopoverContent align="end" className="p-0 w-xs">
          <div className="p-0">
            {/* header */}
            <div className="px-4 py-2 border-b">
              <h3 className="font-semibold text-sm">Workspace members</h3>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>

            {/* search */}
            <div className="p-3 border-b">
              <div className="relative">
                <SearchIcon className="size-4 absolute left-3 top-0 translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 h-8"
                  placeholder="Search members..."
                  onChange={(event) => setSearchMember(event.target.value)}
                />
              </div>
            </div>

            {/* Members */}
            <div className="max-h-80 overflow-y-auto">
              {filteredMembers?.map((member) => {
                const memberIsAdmin = isWorkspaceAdmin(member.roles);
                const isSelf = member.id === currentUserId;
                const canRemove = isCurrentUserAdmin && !isSelf && !(memberIsAdmin && adminCount <= 1);

                return (
                  <MemberItem
                    key={member.id}
                    member={member}
                    isOnline={member?.id ? onlineUsersIds.has(member.id) : false}
                    canRemove={canRemove}
                    onRemove={(target) => setPendingAction({ type: "remove", member: target })}
                  />
                );
              })}
            </div>

            {/* Activity */}
            <div className="border-t">
              <div className="px-4 py-2">
                <h3 className="font-semibold text-sm">Recent activity</h3>
              </div>

              <MemberActivityFeed activities={activities ?? []} />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={pendingAction !== null} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${targetName} will lose access to this workspace and its channels.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isActionPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isActionPending ? "Working..." : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
