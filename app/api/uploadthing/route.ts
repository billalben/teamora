import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Node runtime avoids dev callback self-fetch issues with edge handlers.
export const runtime = "nodejs";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,

  // Apply an (optional) custom config:
  // config: { ... },
});
