import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { client } from "@/lib/orpc";
import { AntennaIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { CreateNewChannel } from "./_components/CreateNewChannel";

interface IAppProps {
  params: Promise<{ workspaceId: string }>;
}

const workspaceIdPage = async ({ params }: IAppProps) => {
  const { workspaceId } = await params;
  const { channels } = await client.channel.list();

  if (channels.length >= 1) {
    return redirect(`/workspace/${workspaceId}/channel/${channels[0].id}`);
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <div className="size-12">
              <AntennaIcon className="size-12 text-muted-foreground" />
            </div>
          </EmptyMedia>
          <EmptyTitle>No Channels Found</EmptyTitle>
          <EmptyDescription>No channels available. You can create a new channel to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xs mx-auto">
          <CreateNewChannel />
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default workspaceIdPage;
