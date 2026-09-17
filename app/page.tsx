import { redirect } from "next/navigation";
import { currentWorkspace } from "@/lib/services/session";
import { Entry } from "@/components/domain/entry";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (await currentWorkspace()) redirect("/overview");
  return <Entry />;
}
