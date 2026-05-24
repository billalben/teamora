"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";

interface TAppProps {
  isOpen: boolean;
  handleModal: (isOpen: boolean) => void;
  onUploadComplete: (attachment: { url: string; key: string; name: string }) => void;
  handleStartUpload: () => void;
  handleUploadError: () => void;
  isUploading: boolean;
}

export function ImageUploadModal({
  isOpen,
  handleModal,
  onUploadComplete,
  handleStartUpload,
  handleUploadError,
  isUploading,
}: TAppProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isUploading) {
          handleModal(open);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <UploadDropzone
          endpoint="imageUploader"
          className="ut-uploading:opacity-90 ut-ready:bg-card ut-ready:border-border ut-ready:p-4 ut-ready:rounded-md
          ut-uploading:animate-pulse ut-uploading:bg-muted ut-uploading:border-border ut-uploading:text-muted-foreground
          ut-label:text-sm ut-label:text-muted-foreground ut-allowed-content:text-xs ut-allowed-content:text-muted-foreground*:ut-button:bg-primary rounded-lg border"
          appearance={{
            container: "bg-card",
            label: "text-muted-foreground",
            allowedContent: "text-sm text-muted-foreground",
            button: "bg-primary text-primay-foreground hover:bg-primary/80",
            uploadIcon: "text-muted-foreground",
          }}
          onUploadBegin={handleStartUpload}
          onClientUploadComplete={(res) => {
            const file = res[0];
            if (!file) return;

            toast.success("Image uploaded successfully!");
            onUploadComplete({ url: file.ufsUrl, key: file.key, name: file.name });
          }}
          onUploadError={(error) => {
            handleUploadError();
            toast.error(error.message || "Failed to upload image. Please try again.");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
