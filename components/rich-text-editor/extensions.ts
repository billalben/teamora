import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { all, createLowlight } from "lowlight";
import CodeBlock from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extensions/placeholder";

// create lowlight instance with all languages loaded
const lowlight = createLowlight(all);

export const baseExtensions = [
  // Base extensions for the rich text editor
  StarterKit.configure({
    // Disable the code block extension from StarterKit
    codeBlock: false,
  }),
  // Text alignment extension
  TextAlign.configure({
    types: ["paragraph", "heading"],
  }),
  // Code block extension with syntax highlighting
  CodeBlock.configure({
    lowlight,
  }),
];

export const editorExtensions = [
  // You can add more custom extensions here in the future
  ...baseExtensions,
  // Placeholder extension to show placeholder text when the editor is empty
  Placeholder.configure({
    placeholder: "Start typing your content here...",
  }),
];
