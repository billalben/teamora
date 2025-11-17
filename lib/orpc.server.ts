import "server-only";

import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { router } from "@/app/router";

globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async (clientContext) => {
    const hdrs = await headers();
    // Reuse request from clientContext if available (e.g. provided by middleware), otherwise create a minimal Request.
    const request = clientContext?.request ?? new Request("http://localhost", { headers: hdrs });
    return { request, headers: hdrs }; // ensure the required `request` property is present
  },
});
