"use client";

import { Button } from "@/components/ui/button";
import { EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch } from "@/components/ui/emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlusIcon } from "lucide-react";
import { useState } from "react";

interface iAppProps {
  onSelectEmoji: (emoji: string) => void;
}

export function EmojiReaction({ onSelectEmoji }: iAppProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="size-6">
            <SmilePlusIcon className="size-4" />
          </Button>
        }
      />

      <PopoverContent className="w-fit p-0" align="start">
        <EmojiPicker className="h-80" onEmojiSelect={(e) => handleEmojiSelect(e.emoji)}>
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
}
