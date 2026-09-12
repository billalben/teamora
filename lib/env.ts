import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    ARCJET_KEY: z.string().min(1),
    LLM_KEY: z.string().min(1),

    KINDE_CLIENT_ID: z.string().min(1),
    KINDE_CLIENT_SECRET: z.string().min(1),
    KINDE_ISSUER_URL: z.url(),
    KINDE_SITE_URL: z.url(),
    KINDE_POST_LOGOUT_REDIRECT_URL: z.url(),
    KINDE_POST_LOGIN_REDIRECT_URL: z.url(),
    KINDE_DOMAIN: z.url(),
    KINDE_MANAGEMENT_CLIENT_ID: z.string().min(1),
    KINDE_MANAGEMENT_CLIENT_SECRET: z.string().min(1),

    UPLOADTHING_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_PARTYKIT_HOST: z.string().min(1),
  },
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_PARTYKIT_HOST: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
