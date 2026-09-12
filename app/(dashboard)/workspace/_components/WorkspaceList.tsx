"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useSuspenseQuery } from "@tanstack/react-query";

export function WorkspaceList({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const { data, isError } = useSuspenseQuery(orpc.workspace.list.queryOptions());
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

  if (isError) {
    return <div>Error loading workspaces</div>;
  }

  const renderWorkspaceIcon = (
    workspace: { id: string; name: string; avatar?: string | undefined },
    isActive: boolean
  ) => {
    return (
      <Button
        size="icon"
        className={cn(
          "size-12 transition-all duration-200",
          getWorkspaceColor(workspace.id),
          isActive && "border-2 border-white/70 hover:border-white hover:rounded-lg"
        )}
      >
        <span className="text-sm font-semibold">{workspace.avatar}</span>
      </Button>
    );
  };

  return (
    <div className={cn("flex gap-2", isHorizontal ? "flex-row items-center" : "flex-col")}>
      {data.workspaces.map((workspace) => {
        const isActive = data.currentWorkspace.orgCode === workspace.id;

        return (
          <Tooltip key={workspace.id}>
            {/* disabled to login again if we are already in this workspace */}
            <TooltipTrigger
              render={
                isActive ? (
                  renderWorkspaceIcon(workspace, isActive)
                ) : (
                  <LoginLink orgCode={workspace.id}>{renderWorkspaceIcon(workspace, isActive)}</LoginLink>
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
  );
}
