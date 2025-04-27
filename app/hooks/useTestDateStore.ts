<<<<<<< HEAD
import { create } from 'zustand';

interface TestDateState {
  enabled: boolean;
  testDate: string | null; // ISO string
  setEnabled: (enabled: boolean) => void;
  setTestDate: (date: string | null) => void;
}

export const useTestDateStore = create<TestDateState>((set) => ({
  enabled: false,
  testDate: null,
  setEnabled: (enabled) => set({ enabled }),
  setTestDate: (date) => set({ testDate: date }),
=======
import { create } from 'zustand';

interface TestDateState {
  enabled: boolean;
  testDate: string | null; // ISO string
  setEnabled: (enabled: boolean) => void;
  setTestDate: (date: string | null) => void;
}

export const useTestDateStore = create<TestDateState>((set) => ({
  enabled: false,
  testDate: null,
  setEnabled: (enabled) => set({ enabled }),
  setTestDate: (date) => set({ testDate: date }),
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
})); 