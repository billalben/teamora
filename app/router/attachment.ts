import z from "zod";
import { base } from "../middlewares/base";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { writeSecurityMiddleware } from "../middlewares/arcjet/write";
import { utapi } from "@/lib/uploadthing-server";

export const deleteUpload = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/attachments/delete",
    summary: "Delete staged upload",
    description: "Delete an uploaded file from UploadThing when removed before send.",
    tags: ["Attachment"],
  })
  .input(z.object({ fileKey: z.string().min(1) }))
  .output(z.object({ success: z.literal(true) }))
  .handler(async ({ input }) => {
    await utapi.deleteFiles(input.fileKey);
    return { success: true };
  });
