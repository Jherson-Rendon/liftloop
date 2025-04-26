import React, { useEffect, useState } from "react";
import { getWeightLiftedByWeek, getMachinesFromFirestore, getSessionsFromFirestore, Machine } from "~/lib/storage";
import { WeightLine } from "~/components/charts/WeightLine";
import { Link } from "@remix-run/react";

interface ProgressChartProps {
  userId: string;
}

interface MachineProgress {
  id: number;
  name: string;
  lastWeight: number | null;
  prevWeight: number | null;
  change: 'up' | 'down' | 'same' | 'new';
  category: string;
}

export function ProgressChart({ userId }: ProgressChartProps) {
  const [activeTab, setActiveTab] = useState<"weight" | "machines">("weight");
  const [machineProgress, setMachineProgress] = useState<MachineProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [machineList, setMachineList] = useState<Machine[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchMachineProgress = async () => {
      setLoading(true);
      try {
        if (activeTab === "machines") {
          // Obtener máquinas desde Firestore
          const machines = (await getMachinesFromFirestore(userId)).map((m: any) => ({
            ...m,
            id: Number(m.id),
          }));
          setMachineList(machines);
          // Obtener categorías únicas
          const uniqueCategories = [
            ...new Set(machines.map((m) => m.category)),
          ];
          setCategories(uniqueCategories);
          // Obtener todas las sesiones del usuario desde Firestore
          const allSessions = (await getSessionsFromFirestore(userId)).map((s: any) => ({
            ...s,
            machineId: Number(s.machineId),
          }));
          const progress: MachineProgress[] = await Promise.all(
            machines.map(async (machine) => {
              // Filtrar sesiones por máquina
              const sessions = allSessions.filter(s => s.machineId === machine.id);
              if (sessions.length === 0) {
                return {
                  id: machine.id,
                  name: machine.name,
                  lastWeight: null,
                  prevWeight: null,
                  change: 'new',
                  category: machine.category,
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
                category: machine.category,
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

  // Filtrar por categoría
  const filteredProgress = selectedCategory === "todas"
    ? machineProgress
    : machineProgress.filter(mp => mp.category === selectedCategory);

  // Ordenar por frecuencia de uso (más sesiones) y luego por última fecha
  const frequentMachines = [...filteredProgress]
    .sort((a, b) => {
      // Aquí podrías usar un campo de frecuencia si lo tuvieras, por ahora por lastWeight (proxy de uso)
      if (a.lastWeight === null) return 1;
      if (b.lastWeight === null) return -1;
      return 0;
    })
    .slice(0, 5);

  const machinesToShow = showAll ? filteredProgress : frequentMachines;

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
          <>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="cat-select" className="text-sm text-gray-600 dark:text-gray-300">Categoría:</label>
              <select
                id="cat-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 text-sm"
              >
                <option value="todas">Todas</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {!showAll && filteredProgress.length > 5 && (
                <button
                  className="ml-auto px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  onClick={() => setShowAll(true)}
                >
                  Ver todas
                </button>
              )}
              {showAll && (
                <button
                  className="ml-auto px-3 py-1 bg-gray-300 dark:bg-zinc-600 text-gray-800 dark:text-gray-100 rounded text-xs hover:bg-gray-400 dark:hover:bg-zinc-500"
                  onClick={() => setShowAll(false)}
                >
                  Ver menos
                </button>
              )}
            </div>
            <div className="overflow-y-auto h-full">
              {machinesToShow.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No hay datos de máquinas.</p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {machinesToShow.map((mp) => (
                    <li key={mp.id} className="flex items-center justify-between py-3 px-2">
                      <Link
                        to={`/machine/${mp.id}`}
                        className="font-medium text-blue-700 dark:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-colors"
                      >
                        {mp.name}
                      </Link>
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
          </>
        )}
      </div>
    </div>
  );
} 