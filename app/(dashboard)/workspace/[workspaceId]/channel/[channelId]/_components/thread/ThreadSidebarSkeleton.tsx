import { Skeleton } from "@/components/ui/skeleton";

export function ThreadSidebarSkeleton() {
  return (
    <div className="w-120 border-l flex flex-col h-full">
      {/* Header */}
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-12" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 bg-muted/20 h-full">
          <div className="flex gap-3">
            <Skeleton className="rounded-full size-8 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>

              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Replies section */}
          <div className="p-2 space-y-2 mt-4">
            <Skeleton className="h-4 w-16" />

            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="rounded-full size-6 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>

              <div className="flex gap-2">
                <Skeleton className="rounded-full size-6 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reply form */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
