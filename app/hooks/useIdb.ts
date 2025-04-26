import { get, set, del } from 'idb-keyval';
import { useState, useEffect } from 'react';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Check if IndexedDB is available
export function isIndexedDBAvailable() {
  if (!isBrowser) return false;
  
  try {
    return 'indexedDB' in window;
  } catch {
    return false;
  }
}

// Generic hook for working with IndexedDB
export function useIdb<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isAvailable = isIndexedDBAvailable();

  // Load value from IndexedDB on mount
  useEffect(() => {
    const loadValue = async () => {
      if (!isAvailable) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const storedValue = await get(key);
        if (storedValue !== undefined) {
          setValue(storedValue);
        }
      } catch (err) {
        console.error(`Error loading value for key ${key}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [key, isAvailable]);

  // Function to update value in state and IndexedDB
  const updateValue = async (newValue: T) => {
    if (!isAvailable) {
      throw new Error('IndexedDB no está disponible');
    }

    try {
      setValue(newValue);
      await set(key, newValue);
    } catch (err) {
      console.error(`Error saving value for key ${key}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  // Function to remove value from IndexedDB
  const removeValue = async () => {
    if (!isAvailable) {
      throw new Error('IndexedDB no está disponible');
    }

    try {
      await del(key);
      setValue(initialValue);
    } catch (err) {
      console.error(`Error removing value for key ${key}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  return { value, setValue: updateValue, removeValue, loading, error, isAvailable };
}
