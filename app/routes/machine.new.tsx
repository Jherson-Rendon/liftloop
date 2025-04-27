import React from 'react';
import { useNavigate } from '@remix-run/react';
import { useUserStore } from '~/hooks/useUserStore';
import { AddMachineForm } from '~/components/forms/AddMachineForm';
import type { Machine } from '~/lib/storage';

export default function NewMachine() {
  const { currentUser } = useUserStore();
  console.log('[NewMachine] currentUser:', currentUser);
  const navigate = useNavigate();

  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen">Usuario no encontrado</div>;
  }

  const handleMachineAdded = (machine: Machine) => {
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
      <div className="max-w-lg w-full">
        <AddMachineForm userId={currentUser.id} onMachineAdded={handleMachineAdded} />
      </div>
    </div>
  );
}