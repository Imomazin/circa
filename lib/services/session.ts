import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { workspaceForToken } from "./portfolio";
export const cookieName = "circa-demo";
export const currentWorkspace = cache(async function currentWorkspace() {
  const token = (await cookies()).get(cookieName)?.value;
  return token ? workspaceForToken(token) : null;
});
export async function requireWorkspace() {
  const workspace = await currentWorkspace();
  if (!workspace) redirect("/");
  return workspace;
}
