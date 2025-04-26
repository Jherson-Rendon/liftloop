import React, { useEffect, useState } from "react";
import { getWeightLiftedByWeek, getMachines, getSessionsByMachine } from "~/lib/storage";
import { WeightLine } from "~/components/charts/WeightLine";

interface ProgressChartProps {
  userId: string;
}

interface MachineProgress {
  id: number;
  name: string;
  lastWeight: number | null;
  prevWeight: number | null;
  change: 'up' | 'down' | 'same' | 'new';
}

export function ProgressChart({ userId }: ProgressChartProps) {
  const [activeTab, setActiveTab] = useState<"weight" | "machines">("weight");
  const [machineProgress, setMachineProgress] = useState<MachineProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachineProgress = async () => {
      setLoading(true);
      try {
        if (activeTab === "machines") {
          const machines = await getMachines(userId);
          const progress: MachineProgress[] = await Promise.all(
            machines.map(async (machine) => {
              const sessions = await getSessionsByMachine(userId, machine.id);
              if (sessions.length === 0) {
                return {
                  id: machine.id,
                  name: machine.name,
                  lastWeight: null,
                  prevWeight: null,
                  change: 'new',
                };
              }
              // Ordenar por fecha descendente
              const sorted = sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const last = sorted[0];
              // Buscar la última sesión de la semana anterior
              const lastDate = new Date(last.date);
              const lastWeek = new Date(lastDate);
              lastWeek.setDate(lastDate.getDate() - 7);
              const prev = sorted.find(s => new Date(s.date) < lastWeek);
              let change: 'up' | 'down' | 'same' | 'new' = 'same';
              if (!prev) change = 'new';
              else if (last.weight > prev.weight) change = 'up';
              else if (last.weight < prev.weight) change = 'down';
              return {
                id: machine.id,
                name: machine.name,
                lastWeight: last.weight,
                prevWeight: prev ? prev.weight : null,
                change,
              };
            })
          );
          setMachineProgress(progress);
        }
      } catch (error) {
        console.error("Error fetching machine progress", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachineProgress();
  }, [userId, activeTab]);

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "weight"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("weight")}
        >
          Tu Peso
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "machines"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("machines")}
        >
          Progreso por Máquina
        </button>
      </div>

      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
          </div>
        ) : activeTab === "weight" ? (
          <WeightLine userId={userId} />
        ) : (
          <div className="overflow-y-auto h-full">
            {machineProgress.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No hay datos de máquinas.</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {machineProgress.map((mp) => (
                  <li key={mp.id} className="flex items-center justify-between py-3 px-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{mp.name}</span>
                    <span className="flex items-center gap-2">
                      {mp.lastWeight !== null && (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {mp.lastWeight} kg
                        </span>
                      )}
                      {mp.change === 'up' && <span title="Aumento" className="text-green-600">▲</span>}
                      {mp.change === 'down' && <span title="Disminución" className="text-red-600">▼</span>}
                      {mp.change === 'same' && <span title="Sin cambio" className="text-gray-400">→</span>}
                      {mp.change === 'new' && <span title="Nuevo" className="text-blue-400">★</span>}
                      <span className="text-xs text-gray-400 ml-2">
                        {mp.change === 'new'
                          ? 'nuevo'
                          : mp.prevWeight !== null
                            ? `(antes: ${mp.prevWeight} kg)`
                            : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 