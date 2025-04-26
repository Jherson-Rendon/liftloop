import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import type { Machine, Session } from '~/lib/storage';
import { getMachine, getMachines, getSessionsByMachine, saveSession } from '~/lib/storage';
import { useUserStore } from '~/hooks/useUserStore';
import { useTestDateStore } from '~/hooks/useTestDateStore';
import Modal from 'react-modal';

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

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      if (!id) return;
      try {
        const machineId = parseInt(id);
        const machineData = await getMachine(currentUser.id, machineId);
        if (!machineData) {
          navigate('/');
          return;
        }
        setMachine(machineData);
        const sessionsData = await getSessionsByMachine(currentUser.id, machineId);
        setSessions(sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Error fetching machine data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !machine) return;

    const dateToUse = testDateStore.enabled && testDateStore.testDate ? testDateStore.testDate : new Date().toISOString();

    const newSession: Session = {
      id: Date.now().toString(),
      userId: currentUser.id,
      machineId: machine.id,
      weight: parseFloat(formData.weight),
      reps: parseInt(formData.reps),
      date: dateToUse,
      difficulty: formData.difficulty
    };

    try {
      await saveSession(newSession);
      setSessions([newSession, ...sessions]);
      setFormData({ weight: '', reps: '', difficulty: 'easy' });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!currentUser) return;
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      // Eliminar de storage
      const { entries, del } = await import('idb-keyval');
      const allEntries: [string, any][] = await entries();
      const sessionKey = `session_${currentUser.id}_${sessionId}`;
      if (allEntries.some(([key]) => key === sessionKey)) {
        await del(sessionKey);
      }
      setSessions(updatedSessions);
    }
  };

  const handleEditSession = (session: Session) => {
    setEditSession(session);
    setShowModal(true);
  };

  const handleModalSave = async (updated: Session) => {
    if (!currentUser) return;
    // Actualizar en storage
    await (await import('idb-keyval')).set(`session_${currentUser.id}_${updated.id}`, updated);
    setSessions(sessions.map(s => s.id === updated.id ? updated : s));
    setShowModal(false);
    setEditSession(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditSession(null);
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
            />
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {machine.name}
            </h1>
            <span className="inline-block bg-gray-200 dark:bg-zinc-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {machine.category}
            </span>
          </div>
        </div>

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
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          session.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
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

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Registrar nueva sesión
          </h2>
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

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Guardar sesión
            </button>
          </form>
        </div>

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