import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, Link } from "@remix-run/react";
import type { Machine, User } from "~/lib/storage";
import { MachineCard } from "~/components/cards/MachineCard";
import { ProgressChart } from "~/components/charts/ProgressChart";
import { UserProfile } from "~/components/cards/UserProfile";
import { getMachinesFromFirestore, getFriendsData, getSessionsFromFirestore, findMatchingMachine } from "~/lib/storage";
import TestFirestore from "~/components/TestFirestore";
import { collection, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '~/lib/firebaseConfig';
import { FriendsModal } from "~/components/social/FriendsModal";

interface OutletContext {
  currentUser: User | null;
  machines: Machine[];
}

interface FriendComparisonItem {
  userId: string;
  name: string;
  weight: number | null;
  date: string | null;
}

export default function Index() {
  const context = useOutletContext<OutletContext>();
  const currentUser = context?.currentUser;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [latestSession, setLatestSession] = useState<{ weight: number; reps: number; date: string } | null>(null);
  const [friendComparison, setFriendComparison] = useState<FriendComparisonItem[]>([]);

  const categories = Array.from(new Set(machines.map((m) => m.category)));

  useEffect(() => {
    if (!currentUser) return;

    document.documentElement.classList.add('loaded');
    setLoading(true);

    Promise.all([
      getMachinesFromFirestore(currentUser.id),
      currentUser.friends && currentUser.friends.length > 0 ? getFriendsData(currentUser.friends) : Promise.resolve([]),
      getSessionsFromFirestore(currentUser.id),
    ])
      .then(async ([machineDocs, friends, sessions]) => {
        const parsedMachines: Machine[] = machineDocs.map((item: any) => ({
          id: item.id,
          name: item.name || '',
          image: item.image || '',
          category: item.category || '',
          catalogId: item.catalogId,
        }));

        setMachines(parsedMachines);
        setFriendsList(friends);

        const normalizedSessions = sessions
          .map((session: any) => ({
            ...session,
            weight: Number(session.weight),
            reps: Number(session.reps),
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setLatestSession(
          normalizedSessions.length > 0
            ? {
                weight: normalizedSessions[0].weight,
                reps: normalizedSessions[0].reps,
                date: normalizedSessions[0].date,
              }
            : null
        );
      })
      .catch((error) => {
        console.error('[Home] Error cargando datos:', error);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => {
    const loadComparison = async () => {
      if (!currentUser || selectedFriendIds.length === 0) {
        setFriendComparison([]);
        return;
      }

      const comparison = await Promise.all(
        selectedFriendIds.map(async (friendId) => {
          try {
            const friend = friendsList.find((item) => item.id === friendId);
            if (!friend || machines.length === 0) {
              return null;
            }

            const friendSessions = await getSessionsFromFirestore(friendId);
            const sortedFriendSessions = friendSessions
              .map((session: any) => ({
                ...session,
                weight: Number(session.weight),
              }))
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (sortedFriendSessions.length > 0) {
              return {
                userId: friendId,
                name: friend.name,
                weight: sortedFriendSessions[0].weight,
                date: sortedFriendSessions[0].date,
              };
            }

            const matchingMachine = await findMatchingMachine(friendId, machines[0]);
            if (!matchingMachine) {
              return {
                userId: friendId,
                name: friend.name,
                weight: null,
                date: null,
              };
            }

            return {
              userId: friendId,
              name: friend.name,
              weight: null,
              date: null,
            };
          } catch (error) {
            console.error('Error loading friend comparison:', error);
            return null;
          }
        })
      );

      setFriendComparison(comparison.filter(Boolean) as FriendComparisonItem[]);
    };

    loadComparison();
  }, [currentUser, selectedFriendIds, friendsList, machines]);

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleDeleteMachine = async (machine: Machine) => {
    if (!currentUser) return;
    if (window.confirm(`¿Seguro que deseas eliminar la máquina "${machine.name}"?`)) {
      try {
        await deleteDoc(doc(collection(db, 'machines'), machine.id.toString()));
        setMachines(machines.filter((m) => m.id !== machine.id));
      } catch (error) {
        console.error('Error deleting machine:', error);
      }
    }
  };

  const handleEditMachine = (machine: Machine) => {
    alert(`Editar máquina: ${machine.name}`);
  };

  const visibleMachines = useMemo(() => {
    const filtered = machines.filter(
      (machine) => selectedCategory === 'todas' || machine.category === selectedCategory
    );

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [machines, selectedCategory]);

  const highlightedMachines = visibleMachines.slice(0, 4);
  const remainingMachines = visibleMachines.slice(4);

  return (
    <>
      <TestFirestore />
      {!currentUser ? (
        <div className="flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800">
          <div className="text-center px-8 py-12 rounded-lg bg-zinc-800/50 backdrop-blur-sm max-w-md w-full mx-4">
            <h1 className="text-3xl font-bold text-white mb-4">
              Gym Progress
            </h1>
            <p className="text-gray-300 mb-8">
              Registra y monitorea tu progreso en el gimnasio de manera fácil y efectiva
            </p>
            <div className="space-y-4">
              <Link
                to="/profile/new"
                className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Crear nuevo perfil
              </Link>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-400 bg-zinc-800/50">o</span>
                </div>
              </div>
              <Link
                to="/profile/select"
                className="block w-full bg-zinc-700 text-white px-6 py-3 rounded-lg hover:bg-zinc-600 transition-all duration-200 transform hover:scale-105"
              >
                Usar perfil existente
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 space-y-8">
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-1 space-y-4">
              <UserProfile
                user={currentUser}
                machineCount={machines.length}
                friendCount={friendsList.length}
              />

              <button
                onClick={() => setIsFriendsModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <span>👥</span> Gestionar amigos y competencia
              </button>
            </div>

            <div className="xl:col-span-2 space-y-6">
              <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">
                    Vista general
                  </p>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Entiende tu progreso de un vistazo
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Primero revisa tu estado actual, luego compara con amigos y finalmente baja al detalle de máquinas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                      Último registro
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {latestSession ? `${latestSession.weight} kg` : 'Sin datos'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {latestSession ? `${latestSession.reps} reps · ${new Date(latestSession.date).toLocaleDateString()}` : 'Registra una sesión para comenzar'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                      Máquinas activas
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {machines.length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Organiza tu avance por categoría y récord reciente.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                      Comparación social
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedFriendIds.length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Amigos seleccionados para comparar hoy.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
                <ProgressChart userId={currentUser.id} />
              </section>

              {friendsList.length > 0 && (
                <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-zinc-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">
                        Comparación con amigos
                      </p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Estado actual
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Selecciona amigos para ver rápidamente cómo vas frente a ellos.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-5">
                    {friendsList.map((friend) => {
                      const isSelected = selectedFriendIds.includes(friend.id);
                      return (
                        <button
                          key={friend.id}
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 border ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 ring-1 ring-blue-500'
                            : 'bg-gray-50 dark:bg-zinc-700/50 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700'
                            }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: friend.color }}
                          >
                            {friend.name.charAt(0)}
                          </div>
                          <span className={`text-sm ${isSelected ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                            {friend.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-white dark:bg-zinc-700/50 rounded-lg shadow-sm border-l-4 border-green-500">
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">Tú</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Último esfuerzo registrado</p>
                      </div>
                      {latestSession ? (
                        <div className="text-right">
                          <span className="block font-bold text-lg text-gray-900 dark:text-white">{latestSession.weight} kg</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(latestSession.date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Sin datos</span>
                      )}
                    </div>

                    {selectedFriendIds.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-blue-200 dark:border-zinc-700 text-sm text-gray-500 dark:text-gray-400">
                        Elige uno o más amigos para activar la comparación.
                      </div>
                    ) : (
                      friendComparison.map((friend) => (
                        <div key={friend.userId} className="flex justify-between items-center p-4 bg-white/80 dark:bg-zinc-700/30 rounded-lg border-l-4 border-blue-400 ml-0 sm:ml-4">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">{friend.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Último registro disponible</p>
                          </div>
                          {friend.weight !== null ? (
                            <div className="text-right">
                              <span className="block font-bold text-lg text-blue-700 dark:text-blue-300">{friend.weight} kg</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{friend.date ? new Date(friend.date).toLocaleDateString() : ''}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Sin datos comparables</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              <section className="space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">
                      Máquinas
                    </p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Detalle por máquina
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Empieza por las primeras máquinas destacadas y luego revisa el resto.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center">
                      <label htmlFor="cat-select" className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">Categoría:</label>
                      <select
                        id="cat-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="todas">Todas</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <Link
                      to="/machine/new"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md flex items-center gap-1 text-sm font-medium"
                    >
                      <span className="text-lg">+</span> Agregar máquina
                    </Link>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">Cargando máquinas...</div>
                ) : visibleMachines.length === 0 ? (
                  <div className="text-center py-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg">
                    <Link
                      to="/machine/new"
                      className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Agregar primera máquina
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {highlightedMachines.map((machine) => (
                        <MachineCard
                          key={machine.id}
                          machine={machine}
                          userId={currentUser.id}
                          onEdit={handleEditMachine}
                          onDelete={handleDeleteMachine}
                          friendIds={selectedFriendIds}
                        />
                      ))}
                    </div>

                    {remainingMachines.length > 0 && (
                      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                          Más máquinas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {remainingMachines.map((machine) => (
                            <MachineCard
                              key={machine.id}
                              machine={machine}
                              userId={currentUser.id}
                              onEdit={handleEditMachine}
                              onDelete={handleDeleteMachine}
                              friendIds={selectedFriendIds}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </section>

          <FriendsModal
            isOpen={isFriendsModalOpen}
            onClose={() => setIsFriendsModalOpen(false)}
            currentUser={currentUser}
            onFriendsUpdated={() => {
              window.location.reload();
            }}
          />
        </div>
      )}
    </>
  );
}
