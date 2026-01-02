import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextProxy } from "next/server";

export const config = {
  // matcher tells Next.js which routes to run the middleware on.
  // This runs the middleware on all routes except for static assets.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
        "CATEGORY:WEBHOOK", // Webhooks from trusted services
        // See the full list at https://arcjet.com/bot-list
      ],
    }),
  ],
});

// Pass any existing middleware with the optional existingMiddleware prop
// async function existingMiddleware(req: NextRequest) {
//   const anyReq = req as {
//     nextUrl: NextRequest["nextUrl"];
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     kindeAuth?: { token?: any; user?: any };
//   };

//   const url = req.nextUrl;

//   const orgCode =
//     anyReq.kindeAuth?.user?.org_code || anyReq.kindeAuth?.token?.org_code || anyReq.kindeAuth?.token?.claims?.org_code;

//   // Redirect /workspace to /workspace/{orgCode}
//   if (url.pathname.startsWith("/workspace") && orgCode && !url.pathname.startsWith(`/workspace/${orgCode}`)) {
//     return NextResponse.redirect(new URL(`/workspace/${orgCode}`, req.url));
//   }

//   return NextResponse.next();
// }

export default createMiddleware(
  aj,
  withAuth(undefined, {
    publicPaths: ["/"],
  }) as NextProxy
);
