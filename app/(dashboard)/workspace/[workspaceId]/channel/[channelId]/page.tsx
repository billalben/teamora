"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { usePanelRef, type PanelSize } from "react-resizable-panels";
import { useQuery } from "@tanstack/react-query";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { orpc } from "@/lib/orpc";
import { ChannelRealtimeProvider } from "@/providers/ChannelRealtimeProvider";
import { ThreadProvider, useThread } from "@/providers/ThreadProvider";

import { ChannelHeader } from "./_components/ChannelHeader";
import { MessageInputForm } from "./_components/message/MessageInputForm";
import { MessagesList } from "./_components/MessagesList";
import { ThreadSheet } from "./_components/thread/ThreadSheet";
import { ThreadSidebar } from "./_components/thread/ThreadSidebar";

const THREAD_WIDTH_KEY = "teamora:chat:thread-width";

function ChannelPageMain({ channelId }: { channelId: string }) {
  const { isThreadOpen } = useThread();
  const isMobile = useIsMobile();
  const threadPanelRef = usePanelRef();

  const { data, isError } = useQuery(
    orpc.channel.get.queryOptions({
      input: { channelId },
    })
  );

  const handleThreadResize = React.useCallback(
    (panelSize: PanelSize) => {
      if (isMobile || threadPanelRef.current?.isCollapsed()) return;
      try {
        window.localStorage.setItem(THREAD_WIDTH_KEY, String(Math.round(panelSize.inPixels)));
      } catch {
        // Ignore storage failures.
      }
    },
    [isMobile, threadPanelRef]
  );

  React.useEffect(() => {
    if (isMobile) return;
    const panel = threadPanelRef.current;
    if (!panel) return;

    if (isThreadOpen) {
      let width: number | string = "28rem";
      try {
        const stored = Number(window.localStorage.getItem(THREAD_WIDTH_KEY));
        if (stored > 0) width = stored;
      } catch {
        // Ignore storage failures.
      }
      panel.resize(width);
    } else {
      panel.collapse();
    }
  }, [isThreadOpen, isMobile, threadPanelRef]);

  if (isError) {
    return <p>error</p>;
  }

  const chatColumn = (
    <div className="flex h-full min-h-0 flex-col">
      <ChannelHeader channelName={data?.channelName} />

      <div className="my-2 mb-4 flex-1 overflow-hidden">
        <MessagesList />
      </div>

      <div className="border-t bg-background p-4">
        <MessageInputForm channelId={channelId} user={data?.currentUser} />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 w-full">
        <div className="min-h-0 min-w-0 flex-1">{chatColumn}</div>
        <ThreadSheet />
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
      <ResizablePanel id="chat-main" minSize="40%" className="min-h-0">
        {chatColumn}
      </ResizablePanel>

      {isThreadOpen && <ResizableHandle withHandle />}

      <ResizablePanel
        id="thread"
        panelRef={threadPanelRef}
        collapsible
        collapsedSize={0}
        defaultSize={0}
        minSize="20rem"
        maxSize="36rem"
        onResize={handleThreadResize}
        className="min-h-0 overflow-hidden"
      >
        <div className="h-full min-h-0 w-full">{isThreadOpen && <ThreadSidebar />}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();

  return (
    <ThreadProvider>
      <ChannelRealtimeProvider channelId={channelId}>
        <ChannelPageMain channelId={channelId} />
      </ChannelRealtimeProvider>
    </ThreadProvider>
  );
}
