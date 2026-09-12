import { aj, slidingWindow } from "@/lib/arcjet";
import { base } from "../base";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { sensitiveInfo } from "@arcjet/next";

function buildHeavyWriteAj() {
  return aj
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: 2,
      })
    )
    .withRule(
      sensitiveInfo({
        mode: "LIVE",
        allow: ["CREDIT_CARD_NUMBER", "EMAIL", "PHONE_NUMBER", "IP_ADDRESS"],
      })
    );
}

export const heavyWriteSecurityMiddleware = base
  .$context<{
    request: Request;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildHeavyWriteAj().protect(context.request, {
      userId: context.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITER({
          message: "Access denied: Rate limit exceeded.",
        });
      }

      if (decision.reason.isSensitiveInfo()) {
        throw errors.BAD_REQUEST({
          message: "Access denied: Sensitive information detected.",
        });
      }

      throw errors.FORBIDDEN({
        message: "Access denied.",
      });
    }

    return next();
  });
