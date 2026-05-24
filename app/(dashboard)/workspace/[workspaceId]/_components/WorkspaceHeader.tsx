"use client";

import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";

function WorkspaceHeader() {
  const { data } = useSuspenseQuery(orpc.channel.list.queryOptions());

  return <h1 className="text-lg font-semibold">{data.currentWorkspace.orgName}</h1>;
}

export default WorkspaceHeader;
