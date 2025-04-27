import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getSession, destroySession } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  console.log('[Logout] Iniciando logout');
  const session = await getSession(request);
  // Destruir la sesión y limpiar la cookie correctamente
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session)
    }
  });
}

export async function loader() {
  // Redirigir siempre a la página principal
  return redirect("/");
}