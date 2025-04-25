import React from 'react';
import { useOutletContext } from "@remix-run/react";
import type { Machine, User } from "~/lib/storage";
import { MachineCard } from "~/components/cards/MachineCard";
import { ProgressChart } from "~/components/charts/ProgressChart";
import { UserProfile } from "~/components/cards/UserProfile";
import { AddSessionForm } from "~/components/forms/AddSessionForm";

interface OutletContext {
  currentUser: User | null;
  machines: Machine[];
}

export default function Index() {
  const { currentUser, machines } = useOutletContext<OutletContext>();

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Bienvenido a Gym Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Por favor, crea un perfil para comenzar a registrar tu progreso
          </p>
          <a
            href="/profile/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Perfil
          </a>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} userId={currentUser.id} />
            ))}
          </div>

          {/* Formulario para agregar sesión */}
          <div className="mt-8">
            <AddSessionForm userId={currentUser.id} machines={machines} />
          </div>
        </div>
      </div>
    </div>
  );
} 