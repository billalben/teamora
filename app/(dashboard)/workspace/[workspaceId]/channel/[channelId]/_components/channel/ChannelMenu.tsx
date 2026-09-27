"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { LogOutIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EditChannel } from "./EditChannel";
import { DeleteChannel } from "./DeleteChannel";
import { LeaveChannel } from "./LeaveChannel";
import { ManageChannelMembers } from "./ManageChannelMembers";

type ChannelMenuProps = {
  channelName: string;
  isAdmin: boolean;
  isMember: boolean;
};

type OpenDialog = "edit" | "delete" | "leave" | "members" | null;

export function ChannelMenu({ channelName, isAdmin, isMember }: ChannelMenuProps) {
  const params = useParams<{ channelId: string }>();
  const channelId = params.channelId;

  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);

  const showLeave = !isAdmin && isMember;

  if (!isAdmin && !showLeave) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Channel actions">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end" className="w-52">
          {isAdmin && (
            <>
              <DropdownMenuItem closeOnClick onClick={() => setOpenDialog("edit")}>
                <PencilIcon />
                Rename channel
              </DropdownMenuItem>

              <DropdownMenuItem closeOnClick onClick={() => setOpenDialog("members")}>
                <UsersIcon />
                Manage members
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" closeOnClick onClick={() => setOpenDialog("delete")}>
                <TrashIcon />
                Delete channel
              </DropdownMenuItem>
            </>
          )}

          {showLeave && (
            <DropdownMenuItem variant="destructive" closeOnClick onClick={() => setOpenDialog("leave")}>
              <LogOutIcon />
              Leave channel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isAdmin && (
        <>
          <EditChannel
            channelId={channelId}
            channelName={channelName}
            open={openDialog === "edit"}
            onOpenChange={(open) => setOpenDialog(open ? "edit" : null)}
          />

          <ManageChannelMembers
            channelId={channelId}
            open={openDialog === "members"}
            onOpenChange={(open) => setOpenDialog(open ? "members" : null)}
          />

          <DeleteChannel
            channelId={channelId}
            channelName={channelName}
            open={openDialog === "delete"}
            onOpenChange={(open) => setOpenDialog(open ? "delete" : null)}
          />
        </>
      )}

      {showLeave && (
        <LeaveChannel
          channelId={channelId}
          channelName={channelName}
          open={openDialog === "leave"}
          onOpenChange={(open) => setOpenDialog(open ? "leave" : null)}
        />
      )}
    </>
  );
}
