import { User } from "~/lib/storage";
import { Link, Form } from "@remix-run/react";

interface UserProfileProps {
  user: User;
  machineCount?: number;
  friendCount?: number;
}

export function UserProfile({ user, machineCount = 0, friendCount = 0 }: UserProfileProps) {
  const currentWeight = user.weight && user.weight.length > 0
    ? user.weight[user.weight.length - 1]
    : null;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm"
          style={{ backgroundColor: user.color }}
        >
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {user.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Miembro desde {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
        Este es tu resumen rápido para entender tu estado actual antes de revisar el detalle por máquina.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-gray-50 dark:bg-zinc-900/60 p-4 border border-gray-100 dark:border-zinc-700">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Peso actual
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {currentWeight !== null ? `${currentWeight} kg` : "Sin dato"}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-zinc-900/60 p-4 border border-gray-100 dark:border-zinc-700">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Máquinas
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {machineCount}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-zinc-900/60 p-4 border border-gray-100 dark:border-zinc-700">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Amigos
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {friendCount}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Link
          to="/profile/edit"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Editar perfil
        </Link>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Cerrar sesión
          </button>
        </Form>
      </div>
    </div>
  );
}
