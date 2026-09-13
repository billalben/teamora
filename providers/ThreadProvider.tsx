"use client";

import { createContext, useContext, useState } from "react";

type ThreadContextValue = {
  selectedThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  toggleThread: (messageId: string) => void;
  isThreadOpen: boolean;
};

const ThreadContext = createContext<ThreadContextValue | undefined>(undefined);

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  const openThread = (messageId: string) => {
    setSelectedThreadId(messageId);
    setIsThreadOpen(true);
  };

  const closeThread = () => {
    setSelectedThreadId(null);
    setIsThreadOpen(false);
  };

  const toggleThread = (messageId: string) => {
    if (selectedThreadId === messageId && isThreadOpen) {
      closeThread();
    } else {
      openThread(messageId);
    }
  };

  const value = {
    selectedThreadId,
    openThread,
    closeThread,
    toggleThread,
    isThreadOpen,
  };

  return <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;
}

export function useThread() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThread must be used within a ThreadProvider");
  }
  return context;
}
