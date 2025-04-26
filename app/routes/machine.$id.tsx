import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import type { Machine, Session } from '~/lib/storage';
import { getMachine, getMachines, getSessionsByMachine, saveSession } from '~/lib/storage';
import { useUserStore } from '~/hooks/useUserStore';

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

    const newSession: Session = {
      id: Date.now().toString(),
      userId: currentUser.id,
      machineId: machine.id,
      weight: parseFloat(formData.weight),
      reps: parseInt(formData.reps),
      date: new Date().toISOString(),
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
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="border-b border-gray-200 dark:border-zinc-700 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800 dark:text-gray-200">
                        {session.weight} kg × {session.reps} repeticiones
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      session.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.difficulty === 'easy' ? 'Fácil' :
                       session.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No hay sesiones registradas</p>
          )}
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
      </div>
    </div>
  );
} 