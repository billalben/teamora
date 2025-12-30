import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
async function existingMiddleware(req: NextRequest) {
  const { getClaim } = getKindeServerSession();
  const orgCode = await getClaim("org_code");

  const url = req.nextUrl;

  if (url.pathname.startsWith("/workspace") && !url.pathname.includes(orgCode?.value || "")) {
    url.pathname = `/workspace/${orgCode?.value}`;

    return Response.redirect(url);
  }

  return NextResponse.next();
}

export default createMiddleware(aj, existingMiddleware);
