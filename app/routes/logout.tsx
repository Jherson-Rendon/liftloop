import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { clearCurrentUser } from "~/lib/storage";

export async function action({ request }: ActionFunctionArgs) {
  console.log('[Logout] Iniciando logout');
  await clearCurrentUser();
  console.log('[Logout] Usuario actual borrado');
  return redirect("/");
}

export async function loader() {
  return redirect("/");
} 