import { Form } from '@remix-run/react';
import { Machine } from '~/lib/storage';

interface SessionFormProps {
  userId: string;
  machines: Machine[];
}

export function SessionForm({ userId, machines }: SessionFormProps) {
  return (
    <Form method="post" className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
      <div className="space-y-6">
        <div>
          <label 
            htmlFor="machine" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Máquina
          </label>
          <select
            id="machine"
            name="machineId"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Selecciona una máquina</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Peso (kg)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              required
              min="0"
              step="0.5"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="reps"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Repeticiones
            </label>
            <input
              type="number"
              id="reps"
              name="reps"
              required
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Guardar Sesión
        </button>
      </div>
    </Form>
  );
}
