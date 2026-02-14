import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import type { Machine, Session, User } from '~/lib/storage';
import { getMachine, getMachines, getSessionsByMachine, saveSession, getSessionsFromFirestore, getMachinesFromFirestore, getFriendsData } from '~/lib/storage'; // Updated import
import { useUserStore } from '~/hooks/useUserStore';
import { useTestDateStore } from '~/hooks/useTestDateStore';
import Modal from 'react-modal';
import { collection, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '~/lib/firebaseConfig';

export default function MachineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    weight: '',
    reps: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  });
  const testDateStore = useTestDateStore();
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Social State
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSessions, setFriendSessions] = useState<{ userId: string; name: string; session: Session }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      if (!id) return;
      setIsLoading(true);
      try {
        // Obtener máquinas y asegurar tipado
        const machines = (await getMachinesFromFirestore(currentUser.id)).map((m: any) => ({
          ...m,
          id: Number(m.id),
          name: m.name ?? "",
          image: m.image ?? "",
          category: m.category ?? "",
          userId: m.userId ?? "",
        }));
        const machineData = machines.find(m => m.id === Number(id));
        if (!machineData) {
          navigate('/');
          return;
        }
        setMachine(machineData);

        // Obtener sesiones y asegurar tipado
        const allSessions = (await getSessionsFromFirestore(currentUser.id)).map((s: any) => ({
          ...s,
          id: String(s.id),
          userId: s.userId ?? "",
          machineId: Number(s.machineId),
          weight: Number(s.weight),
          reps: Number(s.reps),
          date: s.date ?? "",
          difficulty: s.difficulty ?? "easy",
        }));
        const sessionsData = allSessions.filter(s => s.machineId === Number(id));
        setSessions(sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // Load friends
        if (currentUser.friends && currentUser.friends.length > 0) {
          const friends = await getFriendsData(currentUser.friends);
          setFriendsList(friends);
        }

      } catch (error) {
        console.error('Error fetching machine data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, id, navigate]);

  // Fetch friend sessions when selection changes
  useEffect(() => {
    const fetchFriendSessions = async () => {
      if (!selectedFriendIds.length || !id) {
        setFriendSessions([]);
        return;
      }

      // Lazy import to avoid potential circular dep issues, though less likely here
      const { getSessionsByMachine, findMatchingMachine } = await import("~/lib/storage");

      const results = [];
      const currentMachineIdNum = parseInt(id, 10);

      // We need the current machine details to find the matching one
      // machine definition is already loaded in 'machine' state
      if (!machine) return;

      for (const friendId of selectedFriendIds) {
        try {
          // Find matching machine in friend's profile
          const friendMachine = await findMatchingMachine(friendId, machine);

          if (friendMachine) {
            const friendMachineId = typeof friendMachine.id === 'string' ? parseInt(friendMachine.id, 10) : friendMachine.id;
            const fSessions = await getSessionsByMachine(friendId, friendMachineId);

            if (fSessions.length > 0) {
              const last = fSessions.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];
              const friend = friendsList.find(f => f.id === friendId);
              if (friend) {
                results.push({ userId: friendId, name: friend.name, session: last });
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching sessions for friend ${friendId}`, err);
        }
      }
      setFriendSessions(results);
    };

    fetchFriendSessions();
  }, [selectedFriendIds, id, friendsList, machine]); // added machine dependency


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !machine) return;
    let dateToUse = testDateStore.enabled && testDateStore.testDate ? testDateStore.testDate : new Date().toISOString();
    // Si la fecha es YYYY-MM-DD, ajusta a mediodía para evitar desfase
    if (testDateStore.enabled && testDateStore.testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDateStore.testDate)) {
      dateToUse = `${testDateStore.testDate}T12:00:00`;
    }
    const newSession: Session = {
      id: Date.now().toString(),
      userId: currentUser.id,
      machineId: Number(machine.id),
      weight: parseFloat(formData.weight),
      reps: parseInt(formData.reps),
      date: dateToUse,
      difficulty: formData.difficulty
    };
    try {
      await setDoc(doc(collection(db, 'session'), newSession.id), newSession);
      setSessions([newSession, ...sessions]);
      setFormData({ weight: '', reps: '', difficulty: 'easy' });
      setShowRegisterModal(false);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!currentUser) return;
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
      try {
        await deleteDoc(doc(collection(db, 'session'), sessionId));
        setSessions(sessions.filter(s => s.id !== sessionId));
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const handleEditSession = (session: Session) => {
    setEditSession(session);
    setShowModal(true);
  };

  const handleModalSave = async (updated: Session) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(collection(db, 'session'), updated.id), updated);
      setSessions(sessions.map(s => s.id === updated.id ? updated : s));
      setShowModal(false);
      setEditSession(null);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditSession(null);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  if (isLoading) {
    console.log('Loading... currentUser:', currentUser, 'id:', id, 'machine:', machine, 'sessions:', sessions);
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!machine) {
    console.log('Machine not found after loading.');
    return <div className="flex justify-center items-center h-screen">Máquina no encontrada</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-zinc-700">
            <img
              src={`/images/machines/${machine.image}`}
              alt={machine.name}
              className="h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgNjBIMTIwVjE0MEg4MFY2MFoiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4=';
                e.currentTarget.onerror = null;
              }}
            />
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 capitalize">
              {machine.name}
            </h1>
            <span className="inline-block bg-gray-200 dark:bg-zinc-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {machine.category}
            </span>
          </div>
        </div>

        {/* Friend Comparison Controls */}
        {friendsList.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8 border border-blue-100 dark:border-blue-900/30">
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

        {/* Latest Comparison Block (If friends selected) */}
        {friendSessions.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-lg shadow-lg p-6 mb-8 border border-blue-100 dark:border-zinc-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              🏆 Estado Actual
            </h3>
            <div className="space-y-3">
              {/* User's Latest */}
              <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-700/50 rounded-lg shadow-sm border-l-4 border-green-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Tú</span>
                </div>
                {sessions.length > 0 ? (
                  <div className="text-right">
                    <span className="block font-bold text-lg text-gray-900 dark:text-white">{sessions[0].weight} kg</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(sessions[0].date).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm italic">Sin datos</span>
                )}
              </div>

              {/* Friends' Latest */}
              {friendSessions.map(fs => (
                <div key={fs.userId} className="flex justify-between items-center p-3 bg-white/80 dark:bg-zinc-700/30 rounded-lg border-l-4 border-blue-400 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600 dark:text-gray-300">{fs.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-lg text-blue-700 dark:text-blue-300">{fs.session.weight} kg</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(fs.session.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Historial de sesiones
          </h2>
          <div className="max-h-64 overflow-y-auto pr-2">
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.slice(0, visibleCount).map((session, idx) => {
                  // Calcular el cambio respecto a la sesión anterior
                  let icon = null;
                  let iconColor = '';
                  if (idx < sessions.length - 1) {
                    const prev = sessions[idx + 1];
                    if (session.weight > prev.weight) {
                      icon = '▲';
                      iconColor = 'text-green-600';
                    } else if (session.weight < prev.weight) {
                      icon = '▼';
                      iconColor = 'text-red-600';
                    } else {
                      icon = '→';
                      iconColor = 'text-gray-400';
                    }
                  } else {
                    icon = '★';
                    iconColor = 'text-blue-400';
                  }
                  return (
                    <div key={session.id} className="relative border-b border-gray-200 dark:border-zinc-700 pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className={iconColor}>{icon}</span>
                            {session.weight} kg × {session.reps} repeticiones
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(session.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${session.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {session.difficulty === 'easy' ? 'Fácil' :
                              session.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                          </span>
                          {/* Botones de editar y eliminar */}
                          <div className="flex gap-1 mt-1">
                            <button
                              type="button"
                              className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs shadow focus:outline-none"
                              title="Editar registro"
                              onClick={() => handleEditSession(session)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs shadow focus:outline-none"
                              title="Eliminar registro"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {visibleCount < sessions.length && (
                  <div className="flex justify-center mt-2">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                      onClick={() => setVisibleCount(visibleCount + 10)}
                    >
                      Cargar más
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No hay sesiones registradas</p>
            )}
          </div>
        </div>

        {/* Botón para abrir el modal de registro */}
        <div className="flex justify-center mb-8">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none shadow"
            onClick={() => setShowRegisterModal(true)}
          >
            <span className="text-lg">+</span> Registrar nueva sesión
          </button>
        </div>

        {/* Modal para registrar nueva sesión */}
        <Modal
          isOpen={showRegisterModal}
          onRequestClose={() => setShowRegisterModal(false)}
          className="fixed inset-0 flex items-center justify-center z-50"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
          ariaHideApp={false}
        >
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Registrar nueva sesión</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                  required
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label htmlFor="reps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Repeticiones
                </label>
                <input
                  type="number"
                  id="reps"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                  required
                  min="1"
                />
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dificultad percibida
                </label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                  required
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Medio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-zinc-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-zinc-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Guardar sesión
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Modal de edición */}
        <Modal
          isOpen={showModal}
          onRequestClose={handleModalClose}
          className="fixed inset-0 flex items-center justify-center z-50"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
          ariaHideApp={false}
        >
          {editSession && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Editar sesión</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleModalSave(editSession);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    value={editSession.weight}
                    onChange={e => setEditSession({ ...editSession, weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Repeticiones</label>
                  <input
                    type="number"
                    value={editSession.reps}
                    onChange={e => setEditSession({ ...editSession, reps: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dificultad percibida</label>
                  <select
                    value={editSession.difficulty}
                    onChange={e => setEditSession({ ...editSession, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 rounded bg-gray-300 dark:bg-zinc-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-zinc-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
