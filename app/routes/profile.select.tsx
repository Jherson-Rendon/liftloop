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
  const [rememberedUserId, setRememberedUserId] = useState<string | null>(null);
  const [showFullList, setShowFullList] = useState(false);

  // Cargar usuario recordado
  useEffect(() => {
    const lastUser = localStorage.getItem("lastUserId");
    if (lastUser) {
      setRememberedUserId(lastUser);
      // Auto-seleccionar si existe en la lista
      const user = users.find(u => u.id === lastUser);
      if (user) {
        setSelectedUser(user);
      }
    } else {
      setShowFullList(true);
    }
  }, [users]);

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

  const handleSwitchUser = () => {
    setSelectedUser(null);
    setShowFullList(true);
    setCodeInput("");
    setError("");
    localStorage.removeItem("lastUserId");
  };

  // Guardar usuario en localStorage al enviar
  const handleFormSubmit = () => {
    if (selectedUser) {
      localStorage.setItem("lastUserId", selectedUser.id);
      setLoading(true);
    }
  };

  const usersList = users || [];
  const filteredUsers = usersList.filter((user: User) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  // Si hay un usuario recordado y no se ha pedido mostrar la lista completa
  const isRememberedView = rememberedUserId && selectedUser && selectedUser.id === rememberedUserId && !showFullList;

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800">
      <div className="px-8 py-12 rounded-lg bg-zinc-800/50 backdrop-blur-sm max-w-md w-full mx-4">

        {/* Header con Logo (Texto por ahora) */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            GYM PROGRESS
          </h1>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Tu mejor versión</p>
        </div>

        {isRememberedView ? (
          /* Vista de Usuario Recordado */
          <div className="text-center">
            <h2 className="text-xl text-white mb-6">Hola de nuevo,</h2>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-zinc-700 shadow-xl"
              style={{ backgroundColor: selectedUser.color }}
            >
              {selectedUser.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold text-white mb-8">{selectedUser.name}</h3>

            <Form method="post" onSubmit={handleFormSubmit}>
              <input type="hidden" name="userId" value={selectedUser.id} />
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Ingresa tu código</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-zinc-900/50 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                  placeholder="••••"
                  name="codeInput"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>
              {error && <div className="text-red-500 text-sm mb-4 bg-red-500/10 py-2 rounded border border-red-500/20">{error}</div>}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/20 mb-4"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Ingresar"}
              </button>
            </Form>

            <button
              onClick={handleSwitchUser}
              className="text-gray-500 hover:text-gray-300 text-sm underline decoration-gray-600 hover:decoration-gray-400 underline-offset-4 transition-colors"
            >
              Cambiar de usuario
            </button>
          </div>
        ) : (
          /* Vista de Lista Completa */
          <>
            <h2 className="text-xl text-white mb-6 text-center">¿Quién está entrenando hoy?</h2>

            <input
              type="text"
              placeholder="Buscar perfil..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full mb-4 px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No se encontraron usuarios</div>
              ) : (
                filteredUsers.map((user: User) => (
                  <button
                    key={user.id}
                    type="button"
                    className="w-full flex items-center p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all duration-200 group"
                    onClick={() => handleSelect(user)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <h3 className="text-gray-200 font-medium group-hover:text-white">{user.name}</h3>
                    </div>
                    <div className="text-gray-600 group-hover:text-gray-400">→</div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-8 text-center pt-6 border-t border-zinc-700">
              <Link
                to="/profile/new"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <span>+</span> Crear nuevo perfil
              </Link>
            </div>
          </>
        )}

        {/* Modal Clásico (Solo para selección desde la lista) */}
        {!isRememberedView && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-xs relative border border-zinc-700">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                onClick={() => setSelectedUser(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg"
                  style={{ backgroundColor: selectedUser.color }}
                >
                  {selectedUser.name.charAt(0)}
                </div>
                <h2 className="text-lg text-white">Hola, <span className="font-bold">{selectedUser.name}</span></h2>
                <p className="text-gray-400 text-sm">Ingresa tu código</p>
              </div>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input type="hidden" name="userId" value={selectedUser.id} />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white text-center text-xl tracking-[0.5em] focus:outline-none focus:border-blue-500 mb-4 shadow-inner"
                  placeholder="••••"
                  name="codeInput"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
                {error && <div className="text-red-400 text-sm mb-4 text-center">{error}</div>}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                  disabled={loading}
                >
                  {loading ? "Verificando..." : "Entrar"}
                </button>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}