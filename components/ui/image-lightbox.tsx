"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ImageLightboxProps = {
  src: string;
  alt?: string;
  children: ReactNode;
};

export function ImageLightbox({ src, alt = "Attachment", children }: ImageLightboxProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger render={<button type="button" className="block cursor-zoom-in" />}>
        {children}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/80 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          {/* eslint-disable-next-line @next/next/no-img-element -- full-screen preview of an UploadThing/SVG attachment */}
          <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />

          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-10 right-0 text-white hover:bg-white/10 hover:text-white"
              >
                <XIcon className="size-5" />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
