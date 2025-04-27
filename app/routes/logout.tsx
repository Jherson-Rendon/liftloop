import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getSession, destroySession } from "~/lib/session";

export async function action({ request }: ActionFunctionArgs) {
  console.log('[Logout] Iniciando logout');
  const session = await getSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session)
    }
  });
}

export async function loader() {
  return redirect("/");
}