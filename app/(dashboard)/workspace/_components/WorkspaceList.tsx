"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

export function WorkspaceList({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const { data, isPending } = useQuery(orpc.workspace.list.queryOptions());
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const isHorizontal = orientation === "horizontal";

  const colorCominations = [
    "bg-blue-500 hover:bg-blue-600 text-white",
    "bg-green-500 hover:bg-green-600 text-white",
    "bg-purple-500 hover:bg-purple-600 text-white",
    "bg-emerald-500 hover:bg-emerald-600 text-white",
    "bg-amber-500 hover:bg-amber-600 text-white",
    "bg-pink-500 hover:bg-pink-600 text-white",
    "bg-cyan-500 hover:bg-cyan-600 text-white",
  ];

  const getWorkspaceColor = (id: string) => {
    const charSum = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colorCominations[charSum % colorCominations.length];
  };

  if (isPending) {
    return (
      <div className={cn("flex gap-2", isHorizontal ? "flex-row items-center" : "flex-col")}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="size-12 animate-pulse rounded-lg bg-background/50" />
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const renderWorkspaceIcon = (
    workspace: { id: string; name: string; avatar?: string | undefined },
    isActive: boolean
  ) => {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "default", size: "icon" }),
          "size-12 transition-all duration-200",
          getWorkspaceColor(workspace.id),
          isActive && "border-2 border-white/70 hover:border-white hover:rounded-lg"
        )}
      >
        <span className="text-sm font-semibold">{workspace.avatar}</span>
      </span>
    );
  };

  return (
    <>
      <div className={cn("flex gap-2", isHorizontal ? "flex-row items-center" : "flex-col")}>
        {data.workspaces.map((workspace) => {
          const isActive = data.currentWorkspace?.orgCode === workspace.id;

          return (
            <Tooltip key={workspace.id}>
              {/* disabled to login again if we are already in this workspace */}
              <TooltipTrigger
                id={`workspace-tooltip-${orientation}-${workspace.id}`}
                render={
                  isActive ? (
                    renderWorkspaceIcon(workspace, isActive)
                  ) : (
                    <a
                      href={getWorkspaceSwitchHref(workspace.id)}
                      aria-label={`Switch to ${workspace.name}`}
                      className="inline-flex cursor-pointer"
                      onClick={() => setSwitchingTo(workspace.id)}
                    >
                      {renderWorkspaceIcon(workspace, isActive)}
                    </a>
                  )
                }
              />

              <TooltipContent side={isHorizontal ? "bottom" : "right"}>
                <p>
                  {workspace.name} {isActive && "(Current)"}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {switchingTo && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2Icon className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Switching workspace…</p>
        </div>
      )}
    </>
  );
}

function getWorkspaceSwitchHref(orgCode: string) {
  const params = new URLSearchParams({
    org_code: orgCode,
    post_login_redirect_url: `/workspace/${orgCode}`,
  });

  return `/api/auth/login?${params.toString()}`;
}
