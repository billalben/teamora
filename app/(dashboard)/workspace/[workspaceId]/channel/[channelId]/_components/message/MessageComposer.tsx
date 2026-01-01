import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { ImageIcon, SendIcon } from "lucide-react";

interface IAppProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  editorKey?: number;
}

export function MessageComposer({ value, onChange, onSubmit, isSubmitting, editorKey }: IAppProps) {
  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        editorKey={editorKey}
        sendButton={
          <Button type="button" size="sm" onClick={onSubmit} disabled={isSubmitting}>
            <SendIcon className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          <Button type="button" size="sm" variant="outline" disabled={isSubmitting}>
            <ImageIcon className="size-4 mr-1" />
            Attach
          </Button>
        }
      />
    </>
  );
}
