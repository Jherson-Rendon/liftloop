import React from "react";
import { Link } from "@remix-run/react";
import type { Machine } from "~/lib/storage";
import { getSessionsByMachine } from "~/lib/storage";

// Base64 encoded simple placeholder image
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgNjBIMTIwVjE0MEg4MFY2MFoiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4=';

interface MachineCardProps {
  machine: Machine;
  userId: string;
  onEdit?: (machine: Machine) => void;
  onDelete?: (machine: Machine) => void;
}

export function MachineCard({ machine, userId, onEdit, onDelete }: MachineCardProps) {
  const [lastSession, setLastSession] = React.useState<{ weight: number; reps: number; date: string; difficulty: 'easy' | 'medium' | 'hard' } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLastSession = async () => {
      try {
        const sessions = await getSessionsByMachine(userId, machine.id);
        if (sessions.length > 0) {
          // Ordenar por fecha descendente y tomar el más reciente
          const lastSession = sessions.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLastSession(lastSession);
        }
      } catch (error) {
        console.error(`Error fetching sessions for machine ${machine.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastSession();
  }, [userId, machine.id]);

  return (
    <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden">
      <Link to={`/machine/${machine.id}`} className="block">
        <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-zinc-700">
          <img
            src={`/images/machines/${machine.image}`}
            alt={machine.name}
            className="h-full object-contain"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {machine.name}
            </h3>
            <span className="inline-block bg-gray-200 dark:bg-zinc-700 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {machine.category}
            </span>
          </div>
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando...</p>
          ) : lastSession ? (
            <div className="mt-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Última sesión:</p>
              <div className="flex justify-between mt-1">
                <span className="text-gray-800 dark:text-gray-200">
                  {lastSession.weight} kg × {lastSession.reps}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {new Date(lastSession.date).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-1">
                <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                  lastSession.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  lastSession.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {lastSession.difficulty === 'easy' ? 'Fácil' :
                   lastSession.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay sesiones registradas
            </p>
          )}
        </div>
      </Link>
      {/* Botones de editar y eliminar */}
      <div className="absolute bottom-2 right-2 flex gap-1 z-10">
        {onEdit && (
          <button
            type="button"
            className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs shadow focus:outline-none"
            title="Editar máquina"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(machine); }}
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs shadow focus:outline-none"
            title="Eliminar máquina"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete(machine); }}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
