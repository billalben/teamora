"use client";

import { useEffect, useRef, useState } from "react";
import { SparkleIcon, SparklesIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { eventIteratorToStream } from "@orpc/server";
import { client } from "@/lib/orpc";
import { useChat } from "@ai-sdk/react";
import { Message, MessageContent, MessageResponse } from "../ai-elements/message";
import { Skeleton } from "../ui/skeleton";

interface iAppProps {
  content: string;
  onAccept?: (text: string) => void;
}

export function ComposeAssistant({ content, onAccept }: iAppProps) {
  const [openPopover, setOpenPopover] = useState(false);

  const contentRef = useRef(content);

  const { messages, status, sendMessage, setMessages, stop, error, clearError } = useChat({
    id: `compose-assistant`,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await client.ai.compose.generate({ content: contentRef.current }, { signal: options.abortSignal })
        );
      },
      reconnectToStream() {
        throw new Error("Reconnecting to stream is not supported for this chat");
      },
    },
  });

  const handleOpenPopover = (open: boolean) => {
    setOpenPopover(open);

    if (open) {
      const hadAssistantMessage = messages.some((m) => m.role === "assistant");

      if (hadAssistantMessage || status !== "ready") {
        return;
      }

      sendMessage({ text: "Rewrite this text" });
    } else {
      stop();
      clearError();

      setMessages([]);
    }
  };

  const lastAssistent = messages.findLast((m) => m.role === "assistant");
  const composeText =
    lastAssistent?.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n\n") ?? "";

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  return (
    <Popover open={openPopover} onOpenChange={handleOpenPopover}>
      <PopoverTrigger
        render={
          <Button type="button" size="sm" className="">
            <span className="flex items-center gap-1">
              <SparkleIcon className="size-3.5" />
              <span className="text-xs font-medium">Summarize</span>
            </span>
          </Button>
        }
      />

      <PopoverContent className="w-100 p-0">
        <div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
            <Button className="flex items-center gap-1">
              <SparklesIcon />
              <span className="text-sm font-medium">Compose Assistant (preview)</span>
            </Button>

            {status === "streaming" && (
              <Button type="button" variant="outline" size="sm" onClick={stop}>
                Stop
              </Button>
            )}
          </div>

          <div className="px-4 py-3 max-h-80 overflow-y-auto">
            {error ? (
              <div>
                <div className="text-red-500">{error.message}</div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    clearError();
                    setMessages([]);
                    sendMessage({ text: "Rewrite this text" });
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : composeText ? (
              <>
                {messages.map(({ role, parts }, index) => (
                  <Message from={role} key={index}>
                    <MessageContent>
                      {parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return <MessageResponse key={`${role}-${i}`}>{part.text}</MessageResponse>;
                        }
                      })}
                    </MessageContent>
                  </Message>
                ))}
              </>
            ) : status === "submitted" || status === "streaming" ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center">Click summarize to generate</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-3 py-2 bg-muted/30">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            onClick={() => {
              stop();
              clearError();
              setMessages([]);
              setOpenPopover(false);
            }}
            disabled={status === "streaming"}
          >
            Decline
          </Button>

          <Button
            type="submit"
            size="sm"
            onClick={() => {
              if (!composeText) return;
              if (onAccept) onAccept(composeText);

              stop();
              clearError();
              setMessages([]);
              setOpenPopover(false);
            }}
            disabled={!composeText}
          >
            Accept
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
