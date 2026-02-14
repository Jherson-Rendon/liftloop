import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from "@remix-run/react";
import type { Machine, User } from "~/lib/storage";
import { MachineCard } from "~/components/cards/MachineCard";
import { ProgressChart } from "~/components/charts/ProgressChart";
import { UserProfile } from "~/components/cards/UserProfile";
import { AddSessionForm } from "~/components/forms/AddSessionForm";
import { AddMachineForm } from "~/components/forms/AddMachineForm";
import { getMachines, getMachinesFromFirestore, getFriendsData } from "~/lib/storage"; // Updated import
import TestFirestore from "~/components/TestFirestore";
import { collection, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '~/lib/firebaseConfig';
import { FriendsModal } from "~/components/social/FriendsModal"; // New import

interface OutletContext {
  currentUser: User | null;
  machines: Machine[];
}

export default function Index() {
  console.log('[Index] Renderizando componente principal', new Date().toISOString());
  const context = useOutletContext<OutletContext>();
  const currentUser = context?.currentUser;
  console.log('[Index] currentUser en render:', currentUser);
  const navigate = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Friends State
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const categories = Array.from(new Set(machines.map(m => m.category)));

  useEffect(() => {
    console.log('[Index] useEffect ejecutado. currentUser:', currentUser, new Date().toISOString());
    if (currentUser) {
      document.documentElement.classList.add('loaded');
      setLoading(true);
      getMachinesFromFirestore(currentUser.id).then(m => {
        console.log('[Firestore] Máquinas obtenidas:', m);
        const machines: Machine[] = m.map((item: any) => ({
          id: item.id,
          name: item.name || '',
          image: item.image || '',
          category: item.category || '',
        }));
        setMachines(machines);
        setLoading(false);
      }).catch(e => {
        console.error('[Firestore] Error obteniendo máquinas:', e);
        setLoading(false);
      });

      // Load friends
      loadFriends();
    }
  }, [currentUser]);

  const loadFriends = async () => {
    if (currentUser && currentUser.friends && currentUser.friends.length > 0) {
      try {
        const friends = await getFriendsData(currentUser.friends);
        setFriendsList(friends);
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    } else {
      setFriendsList([]);
    }
  };

  const handleMachineAdded = async (machine: Machine) => {
    setMachines(prev => [...prev, machine]);
    // Guardar en Firestore
    await setDoc(doc(collection(db, 'machines'), machine.id.toString()), { ...machine, userId: currentUser?.id });
  };

  const handleEditMachine = (machine: Machine) => {
    alert(`Editar máquina: ${machine.name}`);
    // Aquí puedes abrir un modal o formulario de edición en el futuro
  };

  const handleDeleteMachine = async (machine: Machine) => {
    if (!currentUser) return;
    if (window.confirm(`¿Seguro que deseas eliminar la máquina "${machine.name}"?`)) {
      try {
        await deleteDoc(doc(collection(db, 'machines'), machine.id.toString()));
        setMachines(machines.filter(m => m.id !== machine.id));
      } catch (error) {
        console.error('Error deleting machine:', error);
      }
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

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
                Crear Nuevo Perfil
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
                Usar Perfil Existente
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Perfil del usuario */}
            <div className="md:col-span-1">
              <UserProfile user={currentUser} />

              {/* Friends Button (Mobile/Desktop) */}
              <button
                onClick={() => setIsFriendsModalOpen(true)}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <span>👥</span> Amigos y Competencia
              </button>
            </div>

            {/* Contenido principal */}
            <div className="md:col-span-2">
              {/* Gráfico de progreso */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Tu Progreso
                </h2>
                <ProgressChart userId={currentUser.id} />
              </div>

              {/* Máquinas */}
              {loading ? (
                <div className="text-center py-8">Cargando máquinas...</div>
              ) : machines.length === 0 ? (
                <div className="text-center py-8">
                  <Link
                    to="/machine/new"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Agregar primera máquina
                  </Link>
                </div>
              ) : (
                <>
                  {/* Controls Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    {/* Category Filter */}
                    <div className="flex items-center">
                      <label htmlFor="cat-select" className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">Categoría:</label>
                      <select
                        id="cat-select"
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="todas">Todas</option>
                        {categories.map(cat => (
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

                  {/* Comparison Bar (if friends exist) */}
                  {friendsList.length > 0 && (
                    <div className="mb-6 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                        Comparar con:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {friendsList.map(friend => {
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
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {machines
                      .filter(m => selectedCategory === 'todas' || m.category === selectedCategory)
                      .map((machine) => (
                        <MachineCard
                          key={machine.id}
                          machine={machine}
                          userId={currentUser.id}
                          onEdit={handleEditMachine}
                          onDelete={handleDeleteMachine}
                          friendIds={selectedFriendIds} // Pass selected friends
                        />
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <FriendsModal
            isOpen={isFriendsModalOpen}
            onClose={() => setIsFriendsModalOpen(false)}
            currentUser={currentUser}
            onFriendsUpdated={() => {
              // Reload specific parts if needed, mostly handled by state updates but reloading user might be needed for friend list changes
              // In a real app we'd revalidator.revalidate() or similar
              // For now, loadFriends is enough if friend list IDs haven't changed in current user object... wait.
              // If we add a friend, currentUser.friends changes in DB but not in local context unless we refresh.
              // We should probably trigger a reload of currentUser.
              window.location.reload(); // Simple brute force update for now to ensure context updates
            }}
          />
        </div>
      )}
    </>
  );
}