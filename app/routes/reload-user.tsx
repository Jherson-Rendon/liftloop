import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirigir a la página principal (forzando recarga completa)
  return redirect("/");
}

export default function ReloadUser() {
  return null;
} 