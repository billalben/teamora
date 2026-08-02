import type { GroupReactionSchemaType } from "@/app/schemas/message";

export function groupReactions(
  reactions: { emoji: string; userId: string }[],
  userId: string
): GroupReactionSchemaType[] {
  const map = new Map<string, { count: number; reactedByMe: boolean }>();

  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === userId) existing.reactedByMe = true;
    } else {
      map.set(r.emoji, { count: 1, reactedByMe: r.userId === userId });
    }
  }

  return Array.from(map.entries()).map(([emoji, { count, reactedByMe }]) => ({
    emoji,
    count,
    reactedByMe,
  }));
}
