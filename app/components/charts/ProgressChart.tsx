import React, { useEffect, useMemo, useState } from "react";
import { getMachinesFromFirestore, getSessionsFromFirestore, Machine } from "~/lib/storage";
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
  change: "up" | "down" | "same" | "new";
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
        const machines = (await getMachinesFromFirestore(userId)).map((m: any) => ({
          ...m,
          id: Number(m.id),
        }));
        setMachineList(machines);
        setCategories([...new Set(machines.map((m) => m.category))]);

        const allSessions = (await getSessionsFromFirestore(userId)).map((s: any) => ({
          ...s,
          machineId: Number(s.machineId),
        }));

        const progress: MachineProgress[] = machines.map((machine) => {
          const sessions = allSessions
            .filter((s) => s.machineId === machine.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (sessions.length === 0) {
            return {
              id: machine.id,
              name: machine.name,
              lastWeight: null,
              prevWeight: null,
              change: "new",
              category: machine.category,
            };
          }

          const last = sessions[0];
          const prev = sessions[1] || null;
          let change: "up" | "down" | "same" | "new" = "new";

          if (prev) {
            if (last.weight > prev.weight) change = "up";
            else if (last.weight < prev.weight) change = "down";
            else change = "same";
          }

          return {
            id: machine.id,
            name: machine.name,
            lastWeight: last.weight,
            prevWeight: prev ? prev.weight : null,
            change,
            category: machine.category,
          };
        });

        setMachineProgress(progress);
      } catch (error) {
        console.error("Error fetching machine progress", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachineProgress();
  }, [userId]);

  const filteredProgress = selectedCategory === "todas"
    ? machineProgress
    : machineProgress.filter((mp) => mp.category === selectedCategory);

  const frequentMachines = [...filteredProgress]
    .sort((a, b) => {
      if (a.lastWeight === null && b.lastWeight !== null) return 1;
      if (a.lastWeight !== null && b.lastWeight === null) return -1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);

  const machinesToShow = showAll ? filteredProgress : frequentMachines;

  const summary = useMemo(() => {
    const activeMachines = machineProgress.filter((item) => item.lastWeight !== null).length;
    const improving = machineProgress.filter((item) => item.change === "up").length;
    const stable = machineProgress.filter((item) => item.change === "same").length;

    return {
      totalMachines: machineList.length,
      activeMachines,
      improving,
      stable,
    };
  }, [machineList.length, machineProgress]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
            Máquinas registradas
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalMachines}</p>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:text-green-300 mb-1">
            Con actividad
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.activeMachines}</p>
        </div>
        <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300 mb-1">
            Mejorando
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.improving}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Estado de tu progreso
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Primero ves un resumen y luego puedes entrar al detalle de peso o máquinas.
          </p>
        </div>
        {summary.stable > 0 && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
            {summary.stable} sin cambios recientes
          </span>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "weight"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("weight")}
        >
          Tu peso
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "machines"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("machines")}
        >
          Progreso por máquina
        </button>
      </div>

      <div className="h-72">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
          </div>
        ) : activeTab === "weight" ? (
          <WeightLine userId={userId} />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <label htmlFor="cat-select" className="text-sm text-gray-600 dark:text-gray-300">Categoría:</label>
              <select
                id="cat-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 text-sm"
              >
                <option value="todas">Todas</option>
                {categories.map((cat) => (
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
                    <li key={mp.id} className="flex items-center justify-between py-3 px-2 gap-4">
                      <div>
                        <Link
                          to={`/machine/${mp.id}`}
                          className="font-medium text-blue-700 dark:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-colors"
                        >
                          {mp.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {mp.category}
                        </p>
                      </div>
                      <span className="flex items-center gap-2 text-right">
                        {mp.lastWeight !== null && (
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {mp.lastWeight} kg
                          </span>
                        )}
                        {mp.change === "up" && <span title="Aumento" className="text-green-600">▲</span>}
                        {mp.change === "down" && <span title="Disminución" className="text-red-600">▼</span>}
                        {mp.change === "same" && <span title="Sin cambio" className="text-gray-400">→</span>}
                        {mp.change === "new" && <span title="Nuevo" className="text-blue-400">★</span>}
                        <span className="text-xs text-gray-400 ml-2">
                          {mp.change === "new"
                            ? "nuevo"
                            : mp.prevWeight !== null
                              ? `(antes: ${mp.prevWeight} kg)`
                              : ""}
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
