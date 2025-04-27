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
}));