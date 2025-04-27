import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getSession } from "~/lib/session.server";
import { getUsersFromFirestore } from "~/lib/storage";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const currentUserId = session.get("currentUserId");
  let currentUser = null;
  if (currentUserId) {
    const users = await getUsersFromFirestore();
    currentUser = users.find((u: any) => u.id === currentUserId) || null;
  }
  if (!currentUser) {
    return redirect("/profile/new");
  }
  return redirect("/profile/edit");
}

export default function ProfileIndex() {
  return null;
}