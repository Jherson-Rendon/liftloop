import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from "@remix-run/react";
import type { Machine, User } from "~/lib/storage";
import { MachineCard } from "~/components/cards/MachineCard";
import { ProgressChart } from "~/components/charts/ProgressChart";
import { UserProfile } from "~/components/cards/UserProfile";
import { AddSessionForm } from "~/components/forms/AddSessionForm";
import { AddMachineForm } from "~/components/forms/AddMachineForm";
import { getMachines, saveMachines } from "~/lib/storage";

interface OutletContext {
  currentUser: User | null;
  machines: Machine[];
}

export default function Index() {
  const context = useOutletContext<OutletContext>();
  const currentUser = context?.currentUser;
  const navigate = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      document.documentElement.classList.add('loaded');
      setLoading(true);
      getMachines(currentUser.id).then(m => {
        setMachines(m);
        setLoading(false);
      });
    }
  }, [currentUser]);

  const handleMachineAdded = (machine: Machine) => {
    setMachines(prev => [...prev, machine]);
  };

  const handleEditMachine = (machine: Machine) => {
    alert(`Editar máquina: ${machine.name}`);
    // Aquí puedes abrir un modal o formulario de edición en el futuro
  };

  const handleDeleteMachine = async (machine: Machine) => {
    if (!currentUser) return;
    if (window.confirm(`¿Seguro que deseas eliminar la máquina "${machine.name}"?`)) {
      const newMachines = machines.filter(m => m.id !== machine.id);
      await saveMachines(currentUser.id, newMachines);
      setMachines(newMachines);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800">
        <div className="text-center px-8 py-12 rounded-lg bg-zinc-800/50 backdrop-blur-sm max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-white mb-4">
            Gym Progress
          </h1>
          <p className="text-gray-300 mb-8">
            Registra y monitorea tu progreso en el gimnasio de manera fácil y efectiva
          </p>
          <div className="space-y-4">
            <Link
              to="/profile/new"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Crear Nuevo Perfil
            </Link>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-400 bg-zinc-800/50">o</span>
              </div>
            </div>
            <Link
              to="/profile/select"
              className="block w-full bg-zinc-700 text-white px-6 py-3 rounded-lg hover:bg-zinc-600 transition-all duration-200 transform hover:scale-105"
            >
              Usar Perfil Existente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Perfil del usuario */}
        <div className="md:col-span-1">
          <UserProfile user={currentUser} />
        </div>

        {/* Contenido principal */}
        <div className="md:col-span-2">
          {/* Gráfico de progreso */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Tu Progreso
            </h2>
            <ProgressChart userId={currentUser.id} />
          </div>

          {/* Máquinas */}
          {loading ? (
            <div className="text-center py-8">Cargando máquinas...</div>
          ) : machines.length === 0 ? (
            <AddMachineForm userId={currentUser.id} onMachineAdded={handleMachineAdded} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {machines.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    userId={currentUser.id}
                    onEdit={handleEditMachine}
                    onDelete={handleDeleteMachine}
                  />
                ))}
              </div>
              {/* Formulario para agregar más máquinas */}
              <div className="mt-8">
                <AddMachineForm userId={currentUser.id} onMachineAdded={handleMachineAdded} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 