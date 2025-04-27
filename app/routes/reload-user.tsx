<<<<<<< HEAD
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirigir a la página principal (forzando recarga completa)
  return redirect("/");
}

export default function ReloadUser() {
  return null;
=======
import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirigir a la página principal (forzando recarga completa)
  return redirect("/");
}

export default function ReloadUser() {
  return null;
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
} 