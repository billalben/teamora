import { aj, detectBot, shield, slidingWindow } from "@/lib/arcjet";
import { ArcjetNextRequest, sensitiveInfo } from "@arcjet/next";
import { base } from "../base";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";

function buildAiAj() {
  return aj
    .withRule(shield({ mode: "LIVE" }))
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: 3,
      })
    )
    .withRule(
      detectBot({
        mode: "LIVE",
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
      })
    )
    .withRule(
      sensitiveInfo({
        mode: "LIVE",
        allow: ["CREDIT_CARD_NUMBER", "EMAIL", "PHONE_NUMBER", "IP_ADDRESS"],
      })
    );
}

export const aiSecuriyMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildAiAj().protect(context.request, {
      userId: context.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isSensitiveInfo()) {
        throw errors.BAD_REQUEST({
          message: "Access denied: Sensitive information detected.",
        });
      }

      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITER({
          message: "Access denied: Rate limit exceeded.",
        });
      }

      if (decision.reason.isBot()) {
        throw errors.FORBIDDEN({
          message: "Access denied: Bot detected.",
        });
      }

      if (decision.reason.isShield()) {
        throw errors.FORBIDDEN({
          message: "Access denied: Shield rule triggered.",
        });
      }

      throw errors.FORBIDDEN({
        message: "Access denied.",
      });
    }

    return next();
  });
