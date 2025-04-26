import { create } from 'zustand';
import { User, getUser, saveUser, setCurrentUser, getCurrentUser } from '~/lib/storage';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (userId: string) => Promise<void>;
  updateUserWeight: (weight: number) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  setCurrentUserDirect: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  setCurrentUser: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      await setCurrentUser(userId);
      const user = await getUser(userId);
      set({ currentUser: user, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error setting current user', 
        isLoading: false 
      });
    }
  },

  updateUserWeight: async (weight: number) => {
    try {
      set({ isLoading: true, error: null });
      const { currentUser } = get();
      
      if (!currentUser) {
        throw new Error('No current user');
      }
      
      const today = new Date().toISOString().split('T')[0];
      const weights = currentUser.weight || [];
      const weightDates = currentUser.weightDates || [];
      
      // Update or add today's weight
      const todayIndex = weightDates.indexOf(today);
      if (todayIndex >= 0) {
        weights[todayIndex] = weight;
      } else {
        weights.push(weight);
        weightDates.push(today);
      }
      
      const updatedUser = {
        ...currentUser,
        weight: weights,
        weightDates: weightDates,
      };
      
      await saveUser(updatedUser);
      set({ currentUser: updatedUser, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error updating weight', 
        isLoading: false 
      });
    }
  },

  loadCurrentUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await getCurrentUser();
      set({ currentUser: user, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error loading current user', 
        isLoading: false 
      });
    }
  },

  setCurrentUserDirect: (user: User | null) => {
    set({ currentUser: user });
  },
}));
