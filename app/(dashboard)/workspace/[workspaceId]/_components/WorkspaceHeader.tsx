"use client";

import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LeaveWorkspace } from "./LeaveWorkspace";

export function WorkspaceHeader() {
  const { data } = useSuspenseQuery(orpc.channel.list.queryOptions());

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2">
      <h1 className="truncate text-lg font-semibold">{data.currentWorkspace.orgName}</h1>
      <LeaveWorkspace />
    </div>
  );
}
