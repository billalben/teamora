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
    <div className="flex h-dvh w-full overflow-hidden">
      <div className="hidden h-full w-16 flex-col items-center gap-3 border-r border-border bg-secondary px-2 py-3 md:flex">
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

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>

      {/* dev tanstack */}
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
}
