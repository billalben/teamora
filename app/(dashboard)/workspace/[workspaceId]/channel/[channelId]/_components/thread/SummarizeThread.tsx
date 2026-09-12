"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SparkleIcon, SparklesIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { eventIteratorToStream } from "@orpc/client";
import { client } from "@/lib/orpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";

type SummarizeThreadProps = {
  messageId: string;
};

export function SummarizeThread({ messageId }: SummarizeThreadProps) {
  const [openPopover, setOpenPopover] = useState(false);

  const handleOpenPopover = (open: boolean) => {
    setOpenPopover(open);

    if (open) {
      const hadAssistantMessage = messages.some((m) => m.role === "assistant");

      if (hadAssistantMessage || status !== "ready") {
        return;
      }

      sendMessage({ text: "Summarize Thread" });
    } else {
      stop();
      clearError();

      setMessages([]);
    }
  };

  const { messages, status, sendMessage, setMessages, stop, error, clearError } = useChat({
    id: `thread-summary:${messageId}`,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await client.ai.thread.summary.generate({ messageId }, { signal: options.abortSignal })
        );
      },
      reconnectToStream() {
        throw new Error("Reconnecting to stream is not supported for this chat");
      },
    },
  });

  const lastAssistent = messages.findLast((m) => m.role === "assistant");
  const summaryText =
    lastAssistent?.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n\n") ?? "";

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

      <PopoverContent className="w-100 p-0" align="end">
        <div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
            <Button className="flex items-center gap-1">
              <SparklesIcon />
              <span className="text-sm font-medium">Ai summary (preview)</span>
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
                    sendMessage({ text: "Summarize Thread" });
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : summaryText ? (
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

                {/* <p>{summaryText}</p> */}
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
      </PopoverContent>
    </Popover>
  );
}
