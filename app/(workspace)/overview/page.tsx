import { requireWorkspace } from "@/lib/services/session";
import { getPortfolio } from "@/lib/services/portfolio";
import { Portfolio } from "@/components/domain/portfolio";
export default async function Page() {
  const w = await requireWorkspace();
  return <Portfolio rows={await getPortfolio(w.id)} />;
}
