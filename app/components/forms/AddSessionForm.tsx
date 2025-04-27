<<<<<<< HEAD
import React from "react";
import { Form } from "@remix-run/react";
import type { Machine } from "~/lib/storage";
import { saveSession } from "~/lib/storage";

interface AddSessionFormProps {
  userId: string;
  machines: Machine[];
}

export function AddSessionForm({ userId, machines }: AddSessionFormProps) {
  const [selectedMachine, setSelectedMachine] = React.useState<number | null>(null);
  const [weight, setWeight] = React.useState<number | null>(null);
  const [reps, setReps] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !weight || !reps) {
      setMessage({ text: "Todos los campos son requeridos", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = {
        id: crypto.randomUUID(),
        userId,
        machineId: selectedMachine,
        weight,
        reps,
        date: new Date().toISOString(),
      };

      await saveSession(session);
      setMessage({ text: "Sesión registrada correctamente", type: "success" });
      setSelectedMachine(null);
      setWeight(null);
      setReps(null);
    } catch (error) {
      setMessage({ text: "Error al guardar la sesión", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Registrar Nueva Sesión
      </h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="machine" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Máquina
          </label>
          <select
            id="machine"
            value={selectedMachine || ""}
            onChange={(e) => setSelectedMachine(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            required
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
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Peso (kg)
            </label>
            <input
              type="number"
              id="weight"
              value={weight || ""}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              min="1"
              step="0.5"
              required
            />
          </div>

          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repeticiones
            </label>
            <input
              type="number"
              id="reps"
              value={reps || ""}
              onChange={(e) => setReps(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              min="1"
              step="1"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:bg-blue-400"
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
=======
import React from "react";
import { Form } from "@remix-run/react";
import type { Machine } from "~/lib/storage";
import { saveSession } from "~/lib/storage";

interface AddSessionFormProps {
  userId: string;
  machines: Machine[];
}

export function AddSessionForm({ userId, machines }: AddSessionFormProps) {
  const [selectedMachine, setSelectedMachine] = React.useState<number | null>(null);
  const [weight, setWeight] = React.useState<number | null>(null);
  const [reps, setReps] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !weight || !reps) {
      setMessage({ text: "Todos los campos son requeridos", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = {
        id: crypto.randomUUID(),
        userId,
        machineId: selectedMachine,
        weight,
        reps,
        date: new Date().toISOString(),
      };

      await saveSession(session);
      setMessage({ text: "Sesión registrada correctamente", type: "success" });
      setSelectedMachine(null);
      setWeight(null);
      setReps(null);
    } catch (error) {
      setMessage({ text: "Error al guardar la sesión", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Registrar Nueva Sesión
      </h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="machine" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Máquina
          </label>
          <select
            id="machine"
            value={selectedMachine || ""}
            onChange={(e) => setSelectedMachine(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            required
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
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Peso (kg)
            </label>
            <input
              type="number"
              id="weight"
              value={weight || ""}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              min="1"
              step="0.5"
              required
            />
          </div>

          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repeticiones
            </label>
            <input
              type="number"
              id="reps"
              value={reps || ""}
              onChange={(e) => setReps(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              min="1"
              step="1"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:bg-blue-400"
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
} 