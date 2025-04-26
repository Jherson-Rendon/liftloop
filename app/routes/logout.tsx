import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  console.log('[Logout] Iniciando logout');
  // Borrar la cookie currentUserId
  return redirect("/", {
    headers: {
      "Set-Cookie": "currentUserId=; Path=/; Max-Age=0"
    }
  });
}

export async function loader() {
  return redirect("/");
} 