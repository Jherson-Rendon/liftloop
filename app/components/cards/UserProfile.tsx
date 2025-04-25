import { User } from "~/lib/storage";
import { Link } from "@remix-run/react";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: user.color }}
        >
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {user.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Miembro desde {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {user.weight && user.weight.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
            Peso Actual
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {user.weight[user.weight.length - 1]} kg
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link
          to="/profile/edit"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Editar Perfil
        </Link>
        <button
          onClick={() => {
            // Implementar función de logout
          }}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
} 