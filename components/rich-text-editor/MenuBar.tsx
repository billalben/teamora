import { Editor, useEditorState } from "@tiptap/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
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

interface MenuBarProps {
  editor: Editor | null;
}

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
      };
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input border-t-0 border-x-0 rounded-t-lg p-2 bg-card flex flex-wrap gap-1 items-center">
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Toggle
                size="sm"
                pressed={editorState?.isBoldActive}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                className={cn(editorState?.isBoldActive && "bg-muted text-muted-foreground")}
              >
                <BoldIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Toggle
                size="sm"
                pressed={editorState?.isItalicActive}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                className={cn(editorState?.isItalicActive && "bg-muted text-muted-foreground")}
              >
                <ItalicIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Toggle
                size="sm"
                pressed={editorState?.isStrikeActive}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                className={cn(editorState?.isStrikeActive && "bg-muted text-muted-foreground")}
              >
                <StrikethroughIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strike</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Toggle
                size="sm"
                pressed={editorState?.isCodeBlockActive}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
                className={cn(editorState?.isCodeBlockActive && "bg-muted text-muted-foreground")}
              >
                <CodeIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-2"></div>

        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Toggle
                size="sm"
                pressed={editorState?.isBulletListActive}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editorState?.isBulletListActive && "bg-muted text-muted-foreground")}
              >
                <ListIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Toggle
                size="sm"
                pressed={editorState?.isOrderedListActive}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editorState?.isOrderedListActive && "bg-muted text-muted-foreground")}
              >
                <ListOrderedIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Ordered List</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-2"></div>

        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editorState?.canUndo}
                size="sm"
                variant="ghost"
                type="button"
              >
                <UndoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editorState?.canRedo}
                size="sm"
                variant="ghost"
                type="button"
              >
                <RedoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
