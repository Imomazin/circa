import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/services/session";
import { getAssessment } from "@/lib/services/portfolio";
import { Detail } from "@/components/domain/detail";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, q, w] = await Promise.all([
    params,
    searchParams,
    requireWorkspace(),
  ]);
  const data = await getAssessment(w.id, id);
  if (!data) notFound();
  return <Detail data={data} tab={q.tab ?? "overview"} />;
}
