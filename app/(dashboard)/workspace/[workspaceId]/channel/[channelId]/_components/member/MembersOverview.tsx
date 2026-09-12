"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { orpc } from "@/lib/orpc";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import MemberItem from "./MemberItem";
import { useDebounce } from "@/hooks/use-debounce";
import { useParams } from "next/navigation";
import { usePresence } from "@/hooks/use-presence";
import { User } from "@/app/schemas/realtime";

export default function MembersOverview() {
  const [searchMember, setSearchMember] = useState("");
  const debouncedMemberSearch = useDebounce(searchMember, 500);
  const trimLowercaseMemberSearch = debouncedMemberSearch.trim().toLowerCase();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpen = (open: boolean) => {
    setSearchMember("");
    setIsPopoverOpen(open);
  };

  const { data: members, isError } = useQuery(orpc.workspace.member.list.queryOptions());

  const filteredMembers = trimLowercaseMemberSearch
    ? members?.filter((member) => {
        const name = member.full_name?.toLowerCase();
        const email = member.email?.toLowerCase();

        return name?.includes(trimLowercaseMemberSearch) || email?.includes(trimLowercaseMemberSearch);
      })
    : members;

  const { data: workspaceData } = useQuery(orpc.workspace.list.queryOptions());

  const currentUser = workspaceData?.user
    ? ({
        id: workspaceData.user.id,
        email: workspaceData.user.email,
        full_name: workspaceData.user.given_name,
        picture: workspaceData.user.picture,
      } satisfies User)
    : null;

  const params = useParams();

  const workspaceId = params.workspaceId;

  const { onlineUsers } = usePresence({
    room: `workspace-${workspaceId}`,
    currentUser: currentUser,
  });

  const onlineUsersIds = useMemo(() => {
    return new Set(onlineUsers.map((user) => user.id));
  }, [onlineUsers]);

  if (isError) {
    return <p>error</p>;
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <UsersIcon />
            <span>Members</span>
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
            {filteredMembers?.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                isOnline={member?.id ? onlineUsersIds.has(member.id) : false}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
