import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Building2Icon } from "lucide-react";
import { redirect } from "next/navigation";
import { CreateWorkspace } from "./_components/CreateWorkspace";

export default async function WorkspacePage() {
  const { getOrganization } = getKindeServerSession();
  const org = await getOrganization();

  if (org?.orgCode) {
    redirect(`/workspace/${org.orgCode}`);
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <div className="size-12">
              <Building2Icon className="size-12 text-muted-foreground" />
            </div>
          </EmptyMedia>
          <EmptyTitle>No Workspace Found</EmptyTitle>
          <EmptyDescription>You are not part of any workspace yet. Create one to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xs mx-auto">
          <CreateWorkspace idPrefix="empty" />
        </EmptyContent>
      </Empty>
    </div>
  );
}
