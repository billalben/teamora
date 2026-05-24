import Image, { type ImageProps } from "next/image";
import { shouldUseNativeImage } from "@/lib/image";

type AttachmentImageProps = Omit<ImageProps, "src"> & {
  src: string;
  /** Original filename from upload; helps detect SVG when the URL has no extension. */
  fileName?: string;
};

/**
 * Renders user-uploaded attachments. UploadThing URLs and SVGs use a native img because
 * next/image does not reliably render remote SVGs.
 */
export function AttachmentImage({ src, fileName, alt, className, width, height, fill, ...rest }: AttachmentImageProps) {
  if (shouldUseNativeImage(src, fileName)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- uploadthing / SVG attachment
        <img src={src} alt={alt ?? "Attachment"} className={`absolute inset-0 size-full ${className ?? ""}`} />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element -- uploadthing / SVG attachment
      <img
        src={src}
        alt={alt ?? "Attachment"}
        className={className}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
      />
    );
  }

  return (
    <Image src={src} alt={alt ?? "Attachment"} className={className} width={width} height={height} fill={fill} {...rest} />
  );
}
