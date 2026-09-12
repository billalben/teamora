export const CHAT_LAYOUT_COOKIE = "teamora-chat-layout";

export const CHANNEL_SIDEBAR_DEFAULT_WIDTH = 288; // 18rem

export type ChatLayoutState = {
  collapsed: boolean;
  width: number;
  isMobile: boolean;
};

export const defaultChatLayoutState: ChatLayoutState = {
  collapsed: false,
  width: CHANNEL_SIDEBAR_DEFAULT_WIDTH,
  isMobile: false,
};

export function parseChatLayoutState(value: string | undefined): ChatLayoutState {
  if (!value) return defaultChatLayoutState;

  try {
    const parsed = JSON.parse(value) as Partial<ChatLayoutState>;

    return {
      collapsed: typeof parsed.collapsed === "boolean" ? parsed.collapsed : defaultChatLayoutState.collapsed,
      width: typeof parsed.width === "number" && parsed.width > 0 ? parsed.width : defaultChatLayoutState.width,
      isMobile: typeof parsed.isMobile === "boolean" ? parsed.isMobile : defaultChatLayoutState.isMobile,
    };
  } catch {
    return defaultChatLayoutState;
  }
}

export function writeChatLayoutState(state: ChatLayoutState) {
  if (typeof document === "undefined") return;

  try {
    const value = encodeURIComponent(JSON.stringify(state));
    document.cookie = `${CHAT_LAYOUT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Ignore storage failures.
  }
}
