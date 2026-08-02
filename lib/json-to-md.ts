import { baseExtensions } from "@/components/rich-text-editor/extensions";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";

const normalizeWhiteSpace = (text: string) => {
  return text.replace(/\s+/g, " ").trim();
};

export const jsonToMarkdown = (json: string) => {
  const content = JSON.parse(json);

  const markdown = renderToMarkdown({
    extensions: baseExtensions,
    content,
  });

  return normalizeWhiteSpace(markdown);
};
