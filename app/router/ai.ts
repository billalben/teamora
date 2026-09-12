import z from "zod";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorspaceMiddleware } from "../middlewares/workspace";
import prisma from "@/lib/prisma";
import { jsonToMarkdown } from "@/lib/json-to-md";
import { streamText } from "ai";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamToEventIterator } from "@orpc/server";
import { aiSecuriyMiddleware } from "../middlewares/arcjet/ai";
import { env } from "@/lib/env";

const openrouter = createOpenRouter({
  apiKey: env.LLM_KEY,
});

const MODEL_ID = "inclusionai/ling-3.0-flash:free";

const model = openrouter.chat(MODEL_ID);

export const generateThreadSummary = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .route({
    method: "GET",
    path: "/ai/thread/summary",
    summary: "Generate Thread Summary",
    description: "Generate a summary for a thread.",
    tags: ["AI"],
  })
  .input(z.object({ messageId: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const baseMessage = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      select: { id: true, channelId: true, threadId: true },
    });

    if (!baseMessage) {
      throw errors.NOT_FOUND(); // base message not found
    }

    const parentId = baseMessage.threadId ?? baseMessage.id;

    const parent = await prisma.message.findFirst({
      where: {
        id: parentId,
        channel: { workspaceId: context.workspace.orgCode },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
        authorName: true,
        authorAvatarUrl: true,
        replies: {
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorId: true,
            authorName: true,
            authorAvatarUrl: true,
          },
        },
      },
    });

    if (!parent) {
      throw errors.NOT_FOUND(); // parent message not found
    }

    const replies = parent.replies.slice().reverse(); // reverse to get chronological order

    const parentText = jsonToMarkdown(parent.content);

    const lines = [];

    lines.push(`Thread root ${parent.authorName} - ${parent.createdAt}`);
    lines.push(parentText);

    if (replies.length > 0) {
      lines.push("\nReplies");

      for (const reply of replies) {
        const replyText = jsonToMarkdown(reply.content);
        lines.push(`\n${reply.authorName} - ${reply.createdAt}`);
        lines.push(replyText);
      }
    }

    const compiled = lines.join("\n");

    const system = [
      `
        You are an expert technical assistant that summarizes Slack-like discussion threads for a product and engineering team.

## Objective
Produce an accurate, concise summary using ONLY the information contained in the provided thread.

## Rules
- Never invent facts, names, dates, timelines, or decisions.
- Do not infer missing information.
- Preserve original terminology, product names, feature names, ticket IDs, acronyms, and technical vocabulary whenever possible.
- Merge duplicate information and avoid repetition.
- Prioritize:
  1. The main purpose of the discussion.
  2. Decisions that were made.
  3. Important context.
  4. Blockers, unresolved questions, risks, and next steps.
- Ignore greetings, reactions, emojis, acknowledgements ("Thanks", "+1", etc.), and unrelated side conversations unless they affect the outcome.
- Write objectively with no opinions or commentary.

## Output (Markdown)

Write exactly:

1. One concise paragraph (2–4 sentences) that explains:
   - the purpose of the discussion,
   - important context,
   - key decisions,
   - blockers or next steps.

   Do NOT include:
   - a heading
   - introductory text
   - a conclusion
   - bullet points in this section

2. Leave one blank line.

3. Write exactly 2–3 bullet points using "-" where:
   - each bullet is exactly one sentence;
   - each bullet highlights the most important takeaway or action item.

## Fallback

If there is not enough information to produce a meaningful summary:
- Return a single-sentence summary.
- Do NOT include any bullet points.

## Quality Checklist
Before responding, verify that:
- Every statement is supported by the provided thread.
- No information has been fabricated.
- The summary is concise and non-redundant.
- Technical terminology has been preserved.
- The output matches the required format exactly.
        `,
    ].join("\n");

    const result = streamText({
      model,
      system,
      messages: [{ role: "user", content: compiled }],
      temperature: 0.2,
    });

    return streamToEventIterator(result.toUIMessageStream());
  });

export const generateCompose = base
  .use(requiredAuthMiddleware)
  .use(requiredWorspaceMiddleware)
  .use(aiSecuriyMiddleware)
  .route({
    method: "POST",
    path: "/ai/compose/generate",
    summary: "Generate Compose",
    description: "Generate a compose message.",
    tags: ["AI"],
  })
  .input(z.object({ content: z.string() }))
  .handler(({ input }) => {
    const markdown = jsonToMarkdown(input.content);

    const system = [
      `"Do not address the user, ask questions, add greetings, or include
commentary.",
"Keep existing links/mentions intact. Do not change code blocks or inline
code content.",
"Output strictly in Markdown (paragraphs and optional bullet lists). Do
not output any HTML or images.",
"Return ONLY the rewritten content. No preamble, headings, or closing
remarks.",`,
    ].join("\n");

    const reslut = streamText({
      model,
      system,
      messages: [
        { role: "user", content: "Please rewrite and improve the following content:" },
        { role: "user", content: markdown },
      ],
      temperature: 0.2,
    });

    return streamToEventIterator(reslut.toUIMessageStream());
  });
