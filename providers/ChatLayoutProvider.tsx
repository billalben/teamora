"use client";

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { usePanelRef, type PanelSize } from "react-resizable-panels";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { writeChatLayoutState, type ChatLayoutState } from "@/lib/chat-layout";

type ChatLayoutContextValue = {
  isMobile: boolean;
  isChannelSidebarCollapsed: boolean;
  isChannelSidebarOpen: boolean;
  toggleChannelSidebar: () => void;
  setChannelSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setChannelSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChatLayoutContext = React.createContext<ChatLayoutContextValue | undefined>(undefined);

export function ChatLayoutProvider({
  sidebar,
  children,
  initialState,
  hasStoredState,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  initialState: ChatLayoutState;
  hasStoredState: boolean;
}) {
  const isMobile = useIsMobile(initialState.isMobile);
  const pathname = usePathname();

  const [isChannelSidebarOpen, setChannelSidebarOpen] = useState(false);
  const [isChannelSidebarCollapsed, setChannelSidebarCollapsed] = useState(initialState.collapsed);
  const widthRef = useRef(initialState.width);
  const channelPanelRef = usePanelRef();
  // Ignore resize events that fire before the panel has settled after hydration,
  // otherwise the initial 0px measurement collapses (and then reopens) the panel.
  const isPanelReadyRef = useRef(false);

  const isTablet = useIsTablet();
  const [hasAppliedTabletDefault, setHasAppliedTabletDefault] = useState(false);

  // First visit on a tablet-sized viewport: start collapsed.
  if (!hasAppliedTabletDefault && isTablet !== null) {
    setHasAppliedTabletDefault(true);
    if (!hasStoredState && isTablet) setChannelSidebarCollapsed(true);
  }

  // Persist the layout state so the server can render the correct state on the
  // next request (e.g. after a workspace switch reload) without any jump.
  useEffect(() => {
    writeChatLayoutState({
      collapsed: isChannelSidebarCollapsed,
      width: widthRef.current,
      isMobile,
    });
  }, [isChannelSidebarCollapsed, isMobile]);

  // Keep the panel's size in sync with the context state.
  useEffect(() => {
    if (isMobile) return;
    const panel = channelPanelRef.current;
    if (!panel) return;

    if (isChannelSidebarCollapsed) {
      panel.collapse();
    } else {
      panel.resize(widthRef.current);
    }
  }, [isChannelSidebarCollapsed, isMobile, channelPanelRef]);

  // Mark the panel as ready only after the initial layout pass has settled so
  // the first (often 0px) resize event during hydration is ignored.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      isPanelReadyRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Close the mobile drawer whenever navigation happens.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setChannelSidebarOpen(false);
  }

  const handleResize = useCallback(
    (panelSize: PanelSize) => {
      if (isMobile || !isPanelReadyRef.current) return;

      const collapsed = panelSize.inPixels <= 0;
      setChannelSidebarCollapsed((previous) => (previous === collapsed ? previous : collapsed));

      if (collapsed) return;
      widthRef.current = Math.round(panelSize.inPixels);
      writeChatLayoutState({
        collapsed: false,
        width: widthRef.current,
        isMobile,
      });
    },
    [isMobile]
  );

  const toggleChannelSidebar = useCallback(() => {
    if (isMobile) setChannelSidebarOpen((open) => !open);
    else setChannelSidebarCollapsed((collapsed) => !collapsed);
  }, [isMobile]);

  const value = useMemo(
    () => ({
      isMobile,
      isChannelSidebarCollapsed,
      isChannelSidebarOpen,
      toggleChannelSidebar,
      setChannelSidebarOpen,
      setChannelSidebarCollapsed,
    }),
    [isMobile, isChannelSidebarCollapsed, isChannelSidebarOpen, toggleChannelSidebar]
  );

  if (isMobile) {
    return (
      <ChatLayoutContext.Provider value={value}>
        <div className="flex h-full min-h-0 w-full">
          <Sheet open={isChannelSidebarOpen} onOpenChange={setChannelSidebarOpen}>
            <SheetContent side="left" className="w-80 max-w-[85vw] gap-0 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Channels</SheetTitle>
                <SheetDescription>Browse channels and workspace members.</SheetDescription>
              </SheetHeader>
              <div className="h-full min-h-0 w-full">{sidebar}</div>
            </SheetContent>
          </Sheet>

          <div className="min-h-0 min-w-0 flex-1">{children}</div>
        </div>
      </ChatLayoutContext.Provider>
    );
  }

  return (
    <ChatLayoutContext.Provider value={value}>
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
        <ResizablePanel
          id="channel-sidebar"
          panelRef={channelPanelRef}
          collapsible
          collapsedSize={0}
          defaultSize={initialState.collapsed ? 0 : `${initialState.width}px`}
          minSize="14rem"
          maxSize="26rem"
          onResize={handleResize}
          className="min-h-0 overflow-hidden"
        >
          <div className="h-full min-h-0 w-full overflow-hidden">{sidebar}</div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel id="chat" minSize="30%" className="min-h-0">
          <div className="h-full min-h-0 w-full">{children}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ChatLayoutContext.Provider>
  );
}

const TABLET_MEDIA_QUERY = "(min-width: 768px) and (max-width: 1023px)";

function subscribeToTablet(callback: () => void) {
  const mediaQuery = window.matchMedia(TABLET_MEDIA_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getTabletSnapshot() {
  return window.matchMedia(TABLET_MEDIA_QUERY).matches;
}

// Returns null until the client has hydrated so the server and first client
// render agree on the layout, then the actual match after mounting.
function useIsTablet() {
  return useSyncExternalStore<boolean | null>(subscribeToTablet, getTabletSnapshot, () => null);
}

export function useChatLayout() {
  const context = useContext(ChatLayoutContext);
  if (!context) {
    throw new Error("useChatLayout must be used within a ChatLayoutProvider");
  }
  return context;
}
