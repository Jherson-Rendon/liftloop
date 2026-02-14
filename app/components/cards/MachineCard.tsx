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
  friendIds?: string[];
}

export function MachineCard({ machine, userId, onEdit, onDelete, friendIds = [] }: MachineCardProps) {
  const [lastSession, setLastSession] = React.useState<{ weight: number; reps: number; date: string; difficulty: 'easy' | 'medium' | 'hard' } | null>(null);
  const [friendSessions, setFriendSessions] = React.useState<{ userId: string; name: string; session: any }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch Current User Session
  React.useEffect(() => {
    const fetchLastSession = async () => {
      try {
        const machineIdNum = typeof machine.id === 'string' ? parseInt(machine.id, 10) : machine.id;
        const sessions = await getSessionsByMachine(userId, machineIdNum);
        if (sessions.length > 0) {
          const last = sessions.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLastSession(last);
        }
      } catch (error) {
        console.error(`Error fetching sessions for machine ${machine.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastSession();
  }, [userId, machine.id]);

  // Fetch Friends Sessions
  React.useEffect(() => {
    const fetchFriendSessions = async () => {
      if (!friendIds || friendIds.length === 0) {
        setFriendSessions([]);
        return;
      }

      const results = [];
      const { getUser, getSessionsByMachine, findMatchingMachine } = await import("~/lib/storage"); // Lazy import

      for (const friendId of friendIds) {
        try {
          // Find matching machine in friend's profile
          const friendMachine = await findMatchingMachine(friendId, machine);

          if (friendMachine) {
            const machineIdNum = typeof friendMachine.id === 'string' ? parseInt(friendMachine.id, 10) : friendMachine.id;
            const sessions = await getSessionsByMachine(friendId, machineIdNum);
            if (sessions.length > 0) {
              const last = sessions.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];

              // Get friend name (cached/fast usually)
              const user = await getUser(friendId);
              if (user) {
                results.push({ userId: friendId, name: user.name, session: last });
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching friend ${friendId} session`, err);
        }
      }
      setFriendSessions(results);
    };

    fetchFriendSessions();
  }, [friendIds, machine, machine.id]); // machine dependency added to re-run if machine details change

  return (
    <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      <Link to={`/machine/${machine.id}`} className="block flex-1">
        <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-zinc-700 relative">
          <img
            src={`/images/machines/${machine.image}`}
            alt={machine.name}
            className="h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_IMAGE;
              e.currentTarget.onerror = null;
            }}
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize line-clamp-1">
              {machine.name}
            </h3>
            <span className="inline-block bg-gray-200 dark:bg-zinc-700 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {machine.category}
            </span>
          </div>

          {/* User Session */}
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando...</p>
          ) : lastSession ? (
            <div className="mt-2">
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Tu Récord</p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  {lastSession.weight} kg <span className="text-sm font-normal text-gray-500">× {lastSession.reps}</span>
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(lastSession.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 italic">
              Sin registros
            </p>
          )}

          {/* Friends Sessions (Indented) */}
          {friendSessions.length > 0 && (
            <div className="mt-3 border-t border-gray-100 dark:border-zinc-700 pt-2 space-y-2">
              {friendSessions.map((fs) => (
                <div key={fs.userId} className="flex justify-between items-center text-sm pl-3 border-l-2 border-blue-400 ml-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{fs.name}</span>
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {fs.session.weight} kg <span className="text-xs text-gray-500">× {fs.session.reps}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Botones de editar y eliminar */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {onEdit && (
          <button
            type="button"
            className="p-1.5 bg-white/80 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-zinc-700 text-blue-500 rounded-full shadow-sm backdrop-blur-sm transition-colors"
            title="Editar máquina"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(machine); }}
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="p-1.5 bg-white/80 dark:bg-zinc-800/80 hover:bg-red-50 dark:hover:bg-zinc-700 text-red-500 rounded-full shadow-sm backdrop-blur-sm transition-colors"
            title="Eliminar máquina"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete(machine); }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
