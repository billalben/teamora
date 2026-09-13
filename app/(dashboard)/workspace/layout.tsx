import React from "react";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { WorkspaceList } from "./_components/WorkspaceList";
import { CreateWorkspace } from "./_components/CreateWorkspace";
import { UserNav } from "./_components/UserNav";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";

import { QueryDevtools } from "@/components/query-devtools";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const { getOrganization } = getKindeServerSession();
  const organization = await getOrganization();

  // Only prefetch when there is an active workspace. Prefetching while the org is
  // still settling (e.g. right after switching) throws FORBIDDEN and would break the layout.
  if (organization?.orgCode) {
    await queryClient.prefetchQuery(orpc.workspace.list.queryOptions()).catch(() => undefined);
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <div className="hidden h-full w-16 flex-col items-center gap-3 border-r border-border bg-secondary px-2 py-3 md:flex">
        <HydrateClient client={queryClient}>
          <WorkspaceList />
        </HydrateClient>

        <div className="flex-1">
          <CreateWorkspace idPrefix="rail" />
        </div>

        <HydrateClient client={queryClient}>
          <UserNav idPrefix="rail" />
        </HydrateClient>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>

      {/* dev tanstack */}
      <QueryDevtools />
    </div>
  );
}
