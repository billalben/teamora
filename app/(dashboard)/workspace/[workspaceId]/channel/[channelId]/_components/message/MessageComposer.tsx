import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { ImageIcon, SendIcon } from "lucide-react";

interface IAppProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function MessageComposer({ value, onChange, isLoading }: IAppProps) {
  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        sendButton={
          <Button type="submit" size="sm" disabled={isLoading}>
            <SendIcon className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          <Button type="button" size="sm" variant="outline" disabled={isLoading}>
            <ImageIcon className="size-4 mr-1" />
            Attach
          </Button>
        }
      />
    </>
  );
}
