import React, { useEffect, useState } from "react";
import { getUser, updateUserWeight, User } from "~/lib/storage";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Modal from 'react-modal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeightLineProps {
  userId: string;
}

export function WeightLine({ userId }: WeightLineProps) {
  const [weights, setWeights] = useState<number[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchUserWeight = async () => {
    try {
      const user = await getUser(userId);
      if (user && user.weight && user.weightDates) {
        setWeights(user.weight);
        setDates(user.weightDates);
      }
    } catch (error) {
      console.error("Error fetching user weight data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserWeight();
  }, [userId]);

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !newDate) return;

    try {
      await updateUserWeight(userId, parseFloat(newWeight), newDate);
      await fetchUserWeight(); // Recargar datos
      setShowModal(false);
      setNewWeight("");
      setNewDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      console.error("Error al guardar:", error);
      alert(`Error al guardar el peso: ${error.message || error}`);
    }
  };

  const chartData = {
    labels: dates.map(d => new Date(d).toLocaleDateString()),
    datasets: [
      {
        label: 'Peso Corporal (kg)',
        data: weights,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af' // gray-400 equivalent
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' } // zinc-700
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + Registrar Peso
        </button>
      </div>

      <div className="flex-1 min-h-[200px]">
        {weights.length > 0 ? (
          <Line options={options} data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-full border border-dashed border-gray-600 rounded">
            <p className="text-gray-500 dark:text-gray-400">No hay datos de peso. ¡Registra el primero!</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-70 z-40"
        ariaHideApp={false}
      >
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Registrar Peso</h3>
          </div>
          <form onSubmit={handleSaveWeight} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                placeholder="Ej: 85.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
