import React, { useState } from 'react';
import type { Machine } from '~/lib/storage';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '~/lib/firebaseConfig';
import { MACHINE_CATALOG, CatalogMachine } from '~/lib/catalog';

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
  'default-machine.png'
];

export function AddMachineForm({ userId, onMachineAdded }: AddMachineFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogId, setCatalogId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  // Filter catalog based on search
  const filteredCatalog = MACHINE_CATALOG.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCatalogSelect = (machine: CatalogMachine) => {
    setName(machine.name);
    setCategory(machine.category);
    setImage(machine.image);
    setSelectedImage(machine.image); // Auto-select the image
    setCatalogId(machine.id);
    setShowCatalog(false);
  };

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
        catalogId: catalogId, // Save the catalog ID
      };

      await setDoc(doc(collection(db, 'machines'), newId), newMachine);
      onMachineAdded(newMachine);

      // Reset form
      setName('');
      setCategory(categories[0]);
      setImage('');
      setSelectedImage('');
      setCatalogId(undefined);
      setSearchTerm('');
    } catch (err) {
      console.error(err);
      setError('Error al guardar la máquina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Agregar Nueva Máquina</h2>

      {/* Catalog Search Button */}
      {!showCatalog && (
        <button
          type="button"
          onClick={() => setShowCatalog(true)}
          className="w-full mb-4 py-2 px-4 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800 font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-2"
        >
          🔍 Buscar en Catálogo Estándar
        </button>
      )}

      {/* Catalog Selection Modal/Area */}
      {showCatalog && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Seleccionar Máquina</h3>
            <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-zinc-600 rounded-md text-sm dark:bg-zinc-800 dark:text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
            {filteredCatalog.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCatalogSelect(item)}
                className="w-full text-left p-2 hover:bg-blue-50 dark:hover:bg-zinc-600/50 rounded flex items-center gap-2 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-zinc-500"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                  <img src={`/images/machines/${item.image}`} alt="" className="w-full h-full object-cover" onError={e => e.currentTarget.src = '/images/machines/default-machine.png'} />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
                </div>
              </button>
            ))}
            {filteredCatalog.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">No se encontraron resultados</div>
            )}
          </div>
        </div>
      )}

      {error && <div className="mb-4 text-red-600 dark:text-red-400 text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre {catalogId && <span className="text-green-500 text-xs ml-2">(Vinculado al catálogo ✓)</span>}</label>
          <input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              // If user changes name, we might want to warn them linkage could be confusing, but let's keep it simple.
              // Or clear catalogId if they actally change it significantly? 
              // For now, let's keep catalogId bound if it was selected, assuming they are just tweaking the display name.
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
            required
            placeholder="Ej: Press de Banca"
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

        {/* Image Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen</label>

          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {availableImages.map(img => (
              <button
                type="button"
                key={img}
                className={`border rounded-lg p-1 transition-all ${selectedImage === img ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                onClick={() => {
                  setSelectedImage(img);
                  setImage(img);
                }}
                title={img}
              >
                <img src={`/images/machines/${img}`} alt={img} className="w-12 h-12 object-contain" />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={image}
            onChange={e => setImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white text-xs text-gray-500"
            placeholder="Nombre de archivo personalizado (opcional)"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Agregar Máquina'}
        </button>
      </form>
    </div>
  );
}