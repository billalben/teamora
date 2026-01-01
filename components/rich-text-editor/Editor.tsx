"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { MenuBar } from "./MenuBar";
import { ReactNode } from "react";

interface IAppProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any;
  sendButton: ReactNode;
  footerLeft?: ReactNode;
  editorKey?: number;
}

export function RichTextEditor({ field, sendButton, footerLeft, editorKey }: IAppProps) {
  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: (() => {
        if (!field?.value) return "";

        try {
          return JSON.parse(field.value);
        } catch {
          return "";
        }
      })(),
      onUpdate: ({ editor }) => {
        if (field?.onChange) {
          field.onChange(JSON.stringify(editor.getJSON()));
        }
      },
      // Don't render immediately on the server to avoid SSR issues
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg p-3 focus:outline-none dark:prose-invert max-w-none marker:text-primary",
        },
      },
    },
    [editorKey]
  );

  return (
    <div className="relative w-full border border-input rounded-lg overflow-hidden dark:bg-input/30 flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="max-h-52 overflow-y-auto" />

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-input bg-card">
        <div className="min-h-8 flex items-center">{footerLeft}</div>
        <div className="shrink-0">{sendButton}</div>
      </div>
    </div>
  );
}
