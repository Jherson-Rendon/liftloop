import React, { useEffect, useState } from "react";
import { getUser } from "~/lib/storage";

interface WeightLineProps {
  userId: string;
}

export function WeightLine({ userId }: WeightLineProps) {
  const [weights, setWeights] = useState<number[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchUserWeight();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
      </div>
    );
  }

  if (weights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No hay datos de peso disponibles</p>
      </div>
    );
  }

  // Con solo un peso, mostramos un valor único
  if (weights.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{weights[0]} kg</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(dates[0]).toLocaleDateString()}
        </p>
      </div>
    );
  }

  // Crear una visualización simple para múltiples pesos
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end">
        {weights.map((weight, index) => {
          const date = new Date(dates[index]);
          const height = (weight / Math.max(...weights)) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center" style={{ height: "100%" }}>
              <div 
                className="w-full bg-blue-500 rounded-t-sm mx-1" 
                style={{ height: `${height}%` }}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {weight} kg
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {date.toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
