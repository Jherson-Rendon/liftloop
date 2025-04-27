import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData } from "@remix-run/react";
import { getUsersFromFirestore } from "~/lib/storage";
import type { User } from "~/lib/storage";
import React, { useState, useEffect } from "react";
import { getSession, commitSession } from "~/lib/session.server";

// Tipos para las funciones
interface RequestWithFormData extends Request {
  formData(): Promise<FormData>;
}

// Cargar datos desde el servidor, pero sin importaciones de @remix-run/node
export async function loader({ request }: LoaderFunctionArgs) {
  console.log('[Profile Select Loader] Iniciando loader');
  const users = await getUsersFromFirestore();
  console.log('[Profile Select Loader] users:', users);
  if (!users || users.length === 0) {
    return redirect("/profile/new");
  }
  return json({ users });
}

// Manejo de la acción sin importaciones de @remix-run/node
export async function action({ request }: ActionFunctionArgs) {
  console.log('[Profile Select Action] Iniciando action');
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const codeInput = formData.get("codeInput") as string;
  console.log('[Profile Select Action] userId:', userId, 'codeInput:', codeInput);

  if (!userId) {
    console.log('[Profile Select Action] Error: No se proporcionó userId');
    return json({ error: "Se requiere seleccionar un usuario" });
  }

  // Validar el código
  const users = await getUsersFromFirestore() as User[];
  const user = users.find((u) => u.id === userId);
  if (!user || user.code !== codeInput) {
    return json({ error: "Código incorrecto" });
  }

  // Guardar el usuario en la sesión Remix
  const session = await getSession(request);
  session.set("currentUserId", userId);
  const setCookieHeader = await commitSession(session);
  console.log('[Profile Select Action] Set-Cookie header:', setCookieHeader);

  return redirect("/", {
    headers: {
      "Set-Cookie": setCookieHeader
    }
  });
}

// Tipos para la data del loader y action
type LoaderData = {
  users: User[];
};

type ActionData = {
  error?: string;
};

export default function SelectProfile() {
  const { users } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Si hay un error en actionData, mostrarlo
  useEffect(() => {
    if (actionData?.error) {
      setError(actionData.error);
    }
  }, [actionData]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setCodeInput("");
    setError("");
  };

  // El formulario ahora solo envía al servidor, no manipula cookies manualmente
  const handleCodeSubmit = (e: React.FormEvent) => {
    if (!selectedUser) return;
    // El submit real lo hace el <Form method="post" />
  };

  const usersList = users || [];
  const filteredUsers = usersList.filter((user: User) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
          />
          {filteredUsers.length === 0 ? (
            <div className="text-gray-400 text-center">No se encontraron usuarios</div>
          ) : (
            filteredUsers.map((user: User) => (
              <button
                key={user.id}
                type="button"
                className="w-full flex items-center p-4 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-all duration-200"
                onClick={() => handleSelect(user)}
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
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/profile/new"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Crear nuevo perfil
          </Link>
        </div>
        {/* Modal de código */}
        {selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 w-full max-w-xs relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setSelectedUser(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-100">
                Ingresa el código de acceso para <span className="font-bold">{selectedUser.name}</span>
              </h2>
              <Form method="post">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white mb-3 text-center text-lg tracking-widest"
                  placeholder="••••"
                  name="codeInput"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
                {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? "Verificando..." : "Ingresar"}
                </button>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}