import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const WorksspacePage = async () => {
  const { isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect("/");
  }

  return <div>workspace page</div>;
};

export default WorksspacePage;
