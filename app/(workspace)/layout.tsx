import { requireWorkspace } from "@/lib/services/session";
import { Shell } from "@/components/layout/shell";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorkspace();
  return <Shell>{children}</Shell>;
}
