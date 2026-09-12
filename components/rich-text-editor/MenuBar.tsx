import { Editor, useEditorState } from "@tiptap/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Toggle } from "../ui/toggle";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  RedoIcon,
  StrikethroughIcon,
  UndoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ComposeAssistant } from "./ComposeAssistant";
import { markdownToJson } from "@/lib/md-to-json";

type MenuBarProps = {
  editor: Editor | null;
};

export function MenuBar({ editor }: MenuBarProps) {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;

      return {
        isBoldActive: editor.isActive("bold"),
        isItalicActive: editor.isActive("italic"),
        isStrikeActive: editor.isActive("strike"),
        isCodeBlockActive: editor.isActive("codeBlock"),
        isBulletListActive: editor.isActive("bulletList"),
        isOrderedListActive: editor.isActive("orderedList"),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        currentContent: editor.getJSON(),
      };
    },
  });

  if (!editor) {
    return null;
  }

  const handleAccept = (text: string) => {
    try {
      const json = markdownToJson(text);
      editor.commands.setContent(json);
    } catch (error) {
      console.log("something got wrong: ", error);
    }
  };

  return (
    <div className="border border-input border-t-0 border-x-0 rounded-t-lg p-2 bg-card flex flex-wrap gap-1 items-center">
      <div className="flex flex-wrap gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={editorState?.isBoldActive ?? false}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                className={cn(editorState?.isBoldActive && "bg-muted text-muted-foreground")}
              >
                <BoldIcon />
              </Toggle>
            }
          />
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={editorState?.isItalicActive ?? false}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                className={cn(editorState?.isItalicActive && "bg-muted text-muted-foreground")}
              >
                <ItalicIcon />
              </Toggle>
            }
          />
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={editorState?.isStrikeActive ?? false}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                className={cn(editorState?.isStrikeActive && "bg-muted text-muted-foreground")}
              >
                <StrikethroughIcon />
              </Toggle>
            }
          />
          <TooltipContent>Strike</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={editorState?.isCodeBlockActive ?? false}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
                className={cn(editorState?.isCodeBlockActive && "bg-muted text-muted-foreground")}
              >
                <CodeIcon />
              </Toggle>
            }
          />
          <TooltipContent>Code Block</TooltipContent>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-border mx-2"></div>

      <div className="flex flex-wrap gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={editorState?.isBulletListActive ?? false}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editorState?.isBulletListActive && "bg-muted text-muted-foreground")}
              >
                <ListIcon />
              </Toggle>
            }
          />
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                size="sm"
                pressed={editorState?.isOrderedListActive ?? false}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editorState?.isOrderedListActive && "bg-muted text-muted-foreground")}
              >
                <ListOrderedIcon />
              </Toggle>
            }
          />
          <TooltipContent>Ordered List</TooltipContent>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-border mx-2"></div>

      <div className="flex flex-wrap gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editorState?.canUndo}
                size="sm"
                variant="ghost"
                type="button"
              >
                <UndoIcon />
              </Button>
            }
          />
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editorState?.canRedo}
                size="sm"
                variant="ghost"
                type="button"
              >
                <RedoIcon />
              </Button>
            }
          />
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-border mx-2"></div>

      <div className="flex flex-wrap gap-1">
        <ComposeAssistant content={JSON.stringify(editorState?.currentContent)} onAccept={handleAccept} />
      </div>
    </div>
  );
}
