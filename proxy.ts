import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextProxy } from "next/server";

export const config = {
  // matcher tells Next.js which routes to run the middleware on.
  // This runs the middleware on all routes except for static assets.
  // Exclude /api/uploadthing so Arcjet/Kinde do not block UploadThing callbacks.
  matcher: [
    "/((?!_next|api/uploadthing|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
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

export default createMiddleware(
  aj,
  withAuth(undefined, {
    publicPaths: ["/", "/api/uploadthing"],
  }) as NextProxy
);
