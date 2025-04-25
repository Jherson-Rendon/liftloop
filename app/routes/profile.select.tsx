import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUsers, setCurrentUser } from "~/lib/storage";
import type { User } from "~/lib/storage";

export async function loader({ request }: LoaderFunctionArgs) {
  const users = await getUsers();
  
  if (!users || users.length === 0) {
    return redirect("/profile/new");
  }

  return json({ users });
}

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;

  if (!userId) {
    return json({ error: "Se requiere seleccionar un usuario" });
  }

  await setCurrentUser(userId);
  return redirect("/");
}

export default function SelectProfile() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800">
      <div className="px-8 py-12 rounded-lg bg-zinc-800/50 backdrop-blur-sm max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">
          Seleccionar Perfil
        </h1>
        <p className="text-gray-300 mb-8 text-center">
          Elige tu perfil para continuar
        </p>
        
        <div className="space-y-4">
          {users.map((user: User) => (
            <form method="post" key={user.id}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="w-full flex items-center p-4 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-all duration-200"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="ml-4 flex-1 text-left">
                  <h3 className="text-white font-semibold">{user.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Miembro desde {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            </form>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/profile/new"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Crear nuevo perfil
          </Link>
        </div>
      </div>
    </div>
  );
} 