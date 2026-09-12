import React from "react";
import { getQueryClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import { ChatLayoutProvider } from "@/providers/ChatLayoutProvider";

import { ChannelSidebar } from "./_components/ChannelSidebar";

export default async function ChannelListLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(orpc.channel.list.queryOptions());

  return <ChatLayoutProvider sidebar={<ChannelSidebar />}>{children}</ChatLayoutProvider>;
}
