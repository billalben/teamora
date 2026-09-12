function isSvgImageSource(src: string, fileName?: string): boolean {
  const candidates = [src, fileName].filter(Boolean) as string[];

  return candidates.some((value) => {
    const lower = value.toLowerCase().split("?")[0] ?? "";
    return lower.endsWith(".svg") || lower.includes("image/svg");
  });
}

/** UploadThing file URLs often omit the file extension; render them with a native img. */
function isUploadThingFileUrl(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(".ufs.sh");
  } catch {
    return false;
  }
}

export function shouldUseNativeImage(src: string, fileName?: string): boolean {
  return isUploadThingFileUrl(src) || isSvgImageSource(src, fileName);
}

/** Returns the UploadThing file key embedded in a `<app>.ufs.sh/f/<key>` URL, or null. */
export function getUploadThingFileKey(src: string): string | null {
  try {
    const url = new URL(src);
    if (!url.hostname.endsWith(".ufs.sh")) return null;

    const match = url.pathname.match(/^\/f\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}
