import { AttachmentImage } from "@/components/ui/attachment-image";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

interface TAppsProps {
  url: string;
  fileName?: string;
  onRemoveImage: () => void;
  isRemoving?: boolean;
}

export default function AttachmentChip({ url, fileName, onRemoveImage, isRemoving }: TAppsProps) {
  return (
    <div className="group relative overflow-hidden rounded-md bg-muted size-12">
      <AttachmentImage src={url} fileName={fileName} alt="Attachment" fill className="object-cover" />

      <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
        <Button
          type="button"
          variant="destructive"
          className="size-6 p-0 rounded-full"
          onClick={onRemoveImage}
          disabled={isRemoving}
        >
          <XIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
