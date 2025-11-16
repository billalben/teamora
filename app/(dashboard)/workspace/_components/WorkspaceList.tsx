import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function WorkspaceList() {
  // static for now
  const workspaces = [
    { id: "1", name: "Org 1", avatar: "O1" },
    { id: "2", name: "Org 2", avatar: "O2" },
    { id: "3", name: "Org 3", avatar: "O3" },
  ];

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

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {workspaces.map((workspace) => (
          <Tooltip key={workspace.id}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn("size-12 transition-all duration-200", getWorkspaceColor(workspace.id))}
              >
                <span className="text-sm font-semibold">{workspace.avatar}</span>
              </Button>
            </TooltipTrigger>

            <TooltipContent side="right">
              <p>{workspace.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
