import React, { useEffect, useState } from "react";
import { getWeightLiftedByWeek } from "~/lib/storage";
import { WeightByWeekBar } from "~/components/charts/WeightByWeekBar";
import { WeightLine } from "~/components/charts/WeightLine";

interface ProgressChartProps {
  userId: string;
}

export function ProgressChart({ userId }: ProgressChartProps) {
  const [activeTab, setActiveTab] = useState<"weight" | "lifted">("weight");
  const [data, setData] = useState<{ week: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === "lifted") {
          const weightByWeek = await getWeightLiftedByWeek(userId);
          setData(weightByWeek);
        }
      } catch (error) {
        console.error("Error fetching weight data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            activeTab === "lifted"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("lifted")}
        >
          Peso Levantado
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
          <WeightByWeekBar data={data} />
        )}
      </div>
    </div>
  );
} 