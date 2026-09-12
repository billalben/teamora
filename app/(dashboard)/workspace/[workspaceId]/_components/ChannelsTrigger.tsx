"use client";

import { PanelLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatLayout } from "@/providers/ChatLayoutProvider";

export function ChannelsTrigger({ className }: { className?: string }) {
  const { toggleChannelSidebar } = useChatLayout();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleChannelSidebar}
      aria-label="Toggle channels"
    >
      <PanelLeftIcon className="size-4" />
    </Button>
  );
}
