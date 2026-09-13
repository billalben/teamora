import { baseExtensions } from "@/components/rich-text-editor/extensions";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";

function normalizeWhiteSpace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function jsonToMarkdown(json: string) {
  const content = JSON.parse(json);

  const markdown = renderToMarkdown({
    extensions: baseExtensions,
    content,
  });

  return normalizeWhiteSpace(markdown);
}
