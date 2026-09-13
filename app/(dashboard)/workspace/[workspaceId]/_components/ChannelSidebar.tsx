import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { WorkspaceList } from "@/app/(dashboard)/workspace/_components/WorkspaceList";
import { UserNav } from "@/app/(dashboard)/workspace/_components/UserNav";
import { CreateWorkspace } from "@/app/(dashboard)/workspace/_components/CreateWorkspace";

import { ChannelList } from "./ChannelList";
import { CreateNewChannel } from "./CreateNewChannel";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceMembersList } from "./WorkspaceMembersList";

export function ChannelSidebar() {
  const queryClient = getQueryClient();

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-secondary">
      {/* Mobile-only workspace switcher + user menu (the rail is hidden below md) */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-3 pr-10 md:hidden">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <HydrateClient client={queryClient}>
            <WorkspaceList orientation="horizontal" />
          </HydrateClient>
        </div>

        <CreateWorkspace idPrefix="sidebar" />

        <HydrateClient client={queryClient}>
          <UserNav idPrefix="sidebar" />
        </HydrateClient>
      </div>

      {/* Header */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <HydrateClient client={queryClient}>
          <WorkspaceHeader />
        </HydrateClient>
      </div>

      <div className="px-4 py-2">
        {/* Create New Channel */}
        <CreateNewChannel idPrefix="sidebar" />
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180">
            Main
            <ChevronDownIcon size={16} className="transition-transform duration-200" />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <HydrateClient client={queryClient}>
              <ChannelList />
            </HydrateClient>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Members list */}
      <div className="border-t border-border px-4 py-2">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180">
            Members
            <ChevronUpIcon size={16} className="transition-transform duration-200" />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <HydrateClient client={queryClient}>
              <WorkspaceMembersList />
            </HydrateClient>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
