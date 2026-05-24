import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const WorksspacePage = async () => {
  const { getOrganization } = getKindeServerSession();
  const org = await getOrganization();

  if (org?.orgCode) {
    redirect(`/workspace/${org.orgCode}`);
  }

  return null;
};

export default WorksspacePage;
