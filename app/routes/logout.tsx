import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { clearCurrentUser } from "~/lib/storage";

export async function action({ request }: ActionFunctionArgs) {
  await clearCurrentUser();
  return redirect("/");
}

export async function loader() {
  return redirect("/");
} 