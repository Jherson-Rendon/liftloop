import React from "react";

interface WeightByWeekBarProps {
  data: { week: string; total: number }[];
}

export function WeightByWeekBar({ data }: WeightByWeekBarProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    );
  }

  const maxWeight = Math.max(...data.map(item => item.total));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end">
        {data.map((item, index) => {
          const height = (item.total / maxWeight) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center" style={{ height: "100%" }}>
              <div 
                className="w-full bg-green-500 rounded-t-sm mx-1" 
                style={{ height: `${height}%` }}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {item.total} kg
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {item.week}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
