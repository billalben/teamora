import React from "react";
import { WorkspaceList } from "./_components/WorkspaceList";
import { CreateWorkspace } from "./_components/CreateWorkspace";
import { UserNav } from "./_components/UserNav";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(orpc.workspace.list.queryOptions());

  return (
    <div className="flex w-full h-screen">
      <div className="flex h-full w-16 gap-3 flex-col items-center bg-secondary py-3 px-2 border-r border-border">
        <HydrateClient client={queryClient}>
          <WorkspaceList />
        </HydrateClient>

        <div className="flex-1">
          <CreateWorkspace />
        </div>

        <HydrateClient client={queryClient}>
          <UserNav />
        </HydrateClient>
      </div>

      <div className="flex-1 overflow-auto">{children}</div>

      {/* dev tanstack */}
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
}
