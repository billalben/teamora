"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { usePanelRef, type PanelSize } from "react-resizable-panels";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/use-local-storage";

type ChatLayoutContextValue = {
  isMobile: boolean;
  isChannelSidebarCollapsed: boolean;
  isChannelSidebarOpen: boolean;
  toggleChannelSidebar: () => void;
  setChannelSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setChannelSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChatLayoutContext = React.createContext<ChatLayoutContextValue | undefined>(undefined);

const SIDEBAR_COLLAPSED_KEY = "teamora:chat:channel-sidebar-collapsed";
const SIDEBAR_WIDTH_KEY = "teamora:chat:channel-sidebar-width";
const SIDEBAR_DEFAULT_WIDTH = "18rem";

function readStoredWidth() {
  try {
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (stored > 0) return stored;
  } catch {
    // Ignore storage failures.
  }
  return SIDEBAR_DEFAULT_WIDTH;
}

export function ChatLayoutProvider({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const [isChannelSidebarOpen, setChannelSidebarOpen] = React.useState(false);
  const [isChannelSidebarCollapsed, setChannelSidebarCollapsed] = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);
  const [restored, setRestored] = React.useState(false);
  const channelPanelRef = usePanelRef();

  // Restore persisted state once on mount (keeps SSR output stable).
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches;
      if (stored === null && isTablet) {
        // First visit on a tablet-sized viewport: start collapsed.
        setChannelSidebarCollapsed(true);
      }
    } catch {
      // Ignore storage failures.
    }
    setRestored(true);
  }, [setChannelSidebarCollapsed]);

  // Keep the panel's size in sync with the context state.
  React.useEffect(() => {
    if (isMobile || !restored) return;
    const panel = channelPanelRef.current;
    if (!panel) return;

    if (isChannelSidebarCollapsed) {
      panel.collapse();
    } else {
      panel.resize(readStoredWidth());
    }
  }, [isChannelSidebarCollapsed, isMobile, restored, channelPanelRef]);

  // Close the mobile drawer whenever navigation happens.
  React.useEffect(() => {
    setChannelSidebarOpen(false);
  }, [pathname]);

  const handleResize = React.useCallback(
    (panelSize: PanelSize) => {
      if (isMobile || !restored) return;

      const collapsed = panelSize.inPixels <= 0;
      setChannelSidebarCollapsed((previous) => (previous === collapsed ? previous : collapsed));

      if (collapsed) return;
      try {
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(panelSize.inPixels)));
      } catch {
        // Ignore storage failures.
      }
    },
    [isMobile, restored, setChannelSidebarCollapsed]
  );

  const toggleChannelSidebar = React.useCallback(() => {
    if (isMobile) setChannelSidebarOpen((open) => !open);
    else setChannelSidebarCollapsed((collapsed) => !collapsed);
  }, [isMobile, setChannelSidebarCollapsed]);

  const value = React.useMemo(
    () => ({
      isMobile,
      isChannelSidebarCollapsed,
      isChannelSidebarOpen,
      toggleChannelSidebar,
      setChannelSidebarOpen,
      setChannelSidebarCollapsed,
    }),
    [
      isMobile,
      isChannelSidebarCollapsed,
      isChannelSidebarOpen,
      toggleChannelSidebar,
      setChannelSidebarOpen,
      setChannelSidebarCollapsed,
    ]
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
          defaultSize={SIDEBAR_DEFAULT_WIDTH}
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

export function useChatLayout() {
  const context = React.useContext(ChatLayoutContext);
  if (!context) {
    throw new Error("useChatLayout must be used within a ChatLayoutProvider");
  }
  return context;
}
