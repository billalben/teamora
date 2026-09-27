import React from "react";
import { cookies } from "next/headers";
import { getQueryClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import { CHAT_LAYOUT_COOKIE, parseChatLayoutState } from "@/lib/chat-layout";
import { ChatLayoutProvider } from "@/providers/ChatLayoutProvider";
import { WorkspaceRealtimeProvider } from "@/providers/WorkspaceRealtimeProvider";

import { ChannelSidebar } from "./_components/ChannelSidebar";

type ChannelListLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
};

export default async function ChannelListLayout({ children, params }: ChannelListLayoutProps) {
  const { workspaceId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(orpc.channel.list.queryOptions());

  const cookieStore = await cookies();
  const storedChatLayout = cookieStore.get(CHAT_LAYOUT_COOKIE)?.value;
  const initialChatLayout = parseChatLayoutState(storedChatLayout);

  return (
    <WorkspaceRealtimeProvider workspaceId={workspaceId}>
      <ChatLayoutProvider
        sidebar={<ChannelSidebar />}
        initialState={initialChatLayout}
        hasStoredState={storedChatLayout !== undefined}
      >
        {children}
      </ChatLayoutProvider>
    </WorkspaceRealtimeProvider>
  );
}
