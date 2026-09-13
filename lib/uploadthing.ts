import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { generateUploadDropzone } from "@uploadthing/react";

// export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
