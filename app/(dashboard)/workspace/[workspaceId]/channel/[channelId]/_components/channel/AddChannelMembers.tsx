"use client";

import { useState } from "react";
import { UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ManageChannelMembers } from "./ManageChannelMembers";

type AddChannelMembersProps = {
  channelId: string;
};

export function AddChannelMembers({ channelId }: AddChannelMembersProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserPlusIcon />
        Add members
      </Button>

      <ManageChannelMembers channelId={channelId} open={open} onOpenChange={setOpen} />
    </>
  );
}
