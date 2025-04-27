<<<<<<< HEAD
import React, { useState } from 'react';
import type { Machine } from '~/lib/storage';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '~/lib/firebaseConfig';

interface AddMachineFormProps {
  userId: string;
  onMachineAdded: (machine: Machine) => void;
}

const categories = [
  'Pecho',
  'Piernas',
  'Espalda',
  'Brazos',
  'Hombros',
  'Abdomen',
  'Otro',
];

const availableImages = [
  'Bench_press.png',
  'leg-press.png',
  'lat-pulldown.png',
  'bicep-curl.png',
  'shoulder-press.png',
  'tricep-extension.png',
];

export function AddMachineForm({ userId, onMachineAdded }: AddMachineFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!name.trim()) {
        setError('El nombre es obligatorio');
        setLoading(false);
        return;
      }
      const newId = Date.now().toString();
      const imageToUse = image.trim() || selectedImage || 'default-machine.png';
      const newMachine: Machine & { userId: string } = {
        id: newId,
        name: name.trim(),
        category,
        image: imageToUse,
        userId,
      };
      await setDoc(doc(collection(db, 'machines'), newId), newMachine);
      onMachineAdded(newMachine);
      setName('');
      setCategory(categories[0]);
      setImage('');
      setSelectedImage('');
    } catch (err) {
      setError('Error al guardar la máquina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Agregar Nueva Máquina</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen (nombre de archivo, opcional)</label>
        <input
          type="text"
          value={image}
          onChange={e => setImage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white mb-2"
          placeholder="default-machine.png"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {availableImages.map(img => (
            <button
              type="button"
              key={img}
              className={`border rounded p-1 ${selectedImage === img ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedImage(img)}
              title={img}
            >
              <img src={`/images/machines/${img}`} alt={img} className="w-16 h-16 object-contain" />
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Agregar Máquina'}
      </button>
    </form>
  );
=======
import React, { useState } from 'react';
import type { Machine } from '~/lib/storage';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '~/lib/firebaseConfig';

interface AddMachineFormProps {
  userId: string;
  onMachineAdded: (machine: Machine) => void;
}

const categories = [
  'Pecho',
  'Piernas',
  'Espalda',
  'Brazos',
  'Hombros',
  'Abdomen',
  'Otro',
];

const availableImages = [
  'Bench_press.png',
  'leg-press.png',
  'lat-pulldown.png',
  'bicep-curl.png',
  'shoulder-press.png',
  'tricep-extension.png',
];

export function AddMachineForm({ userId, onMachineAdded }: AddMachineFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!name.trim()) {
        setError('El nombre es obligatorio');
        setLoading(false);
        return;
      }
      const newId = Date.now().toString();
      const imageToUse = image.trim() || selectedImage || 'default-machine.png';
      const newMachine: Machine & { userId: string } = {
        id: newId,
        name: name.trim(),
        category,
        image: imageToUse,
        userId,
      };
      await setDoc(doc(collection(db, 'machines'), newId), newMachine);
      onMachineAdded(newMachine);
      setName('');
      setCategory(categories[0]);
      setImage('');
      setSelectedImage('');
    } catch (err) {
      setError('Error al guardar la máquina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Agregar Nueva Máquina</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen (nombre de archivo, opcional)</label>
        <input
          type="text"
          value={image}
          onChange={e => setImage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white mb-2"
          placeholder="default-machine.png"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {availableImages.map(img => (
            <button
              type="button"
              key={img}
              className={`border rounded p-1 ${selectedImage === img ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedImage(img)}
              title={img}
            >
              <img src={`/images/machines/${img}`} alt={img} className="w-16 h-16 object-contain" />
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Agregar Máquina'}
      </button>
    </form>
  );
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
} 