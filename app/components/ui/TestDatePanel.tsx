import React from 'react';
import { useTestDateStore } from '~/hooks/useTestDateStore';

export function TestDatePanel() {
  const { enabled, testDate, setEnabled, setTestDate } = useTestDateStore();
  const [open, setOpen] = React.useState(false);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed top-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg p-3 hover:bg-blue-700 focus:outline-none"
        title="Panel de pruebas de fecha"
      >
        🕒
      </button>
      {/* Panel */}
      {open && (
        <div className="fixed top-20 right-6 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 w-80 border border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Modo pruebas de fecha</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="font-medium">Activar:</label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de prueba</label>
            <input
              type="date"
              value={testDate ? testDate.slice(0, 10) : ''}
              onChange={e => setTestDate(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
              disabled={!enabled}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Si está activado, todos los formularios usarán esta fecha.<br />
            Si está vacío, se usará la fecha actual.
          </div>
        </div>
      )}
    </>
  );
} 