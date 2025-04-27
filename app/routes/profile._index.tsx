<<<<<<< HEAD
import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getCurrentUserFromCookie } from "~/lib/storage";

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await getCurrentUserFromCookie(request);
  if (!currentUser) {
    return redirect("/profile/new");
  }
  return redirect("/profile/edit");
}

export default function ProfileIndex() {
  return null;
=======
import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getCurrentUserFromCookie } from "~/lib/storage";

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await getCurrentUserFromCookie(request);
  if (!currentUser) {
    return redirect("/profile/new");
  }
  return redirect("/profile/edit");
}

export default function ProfileIndex() {
  return null;
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
} 