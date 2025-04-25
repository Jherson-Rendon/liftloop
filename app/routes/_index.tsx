import React, { useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from "@remix-run/react";
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
  const context = useOutletContext<OutletContext>();
  const currentUser = context?.currentUser;
  const machines = context?.machines || [];
  const navigate = useNavigate();

  useEffect(() => {
    // Si hay un usuario, asegurarse de que la página esté completamente cargada
    if (currentUser) {
      document.documentElement.classList.add('loaded');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800">
        <div className="text-center px-4 py-8 rounded-lg bg-zinc-800/50 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white mb-4">
            Bienvenido a Gym Progress
          </h1>
          <p className="text-gray-300 mb-8 max-w-md">
            Por favor, crea un perfil para comenzar a registrar tu progreso
          </p>
          <Link
            to="/profile/new"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Crear Perfil
          </Link>
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