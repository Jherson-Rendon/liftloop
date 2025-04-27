<<<<<<< HEAD
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
=======
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
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
} 