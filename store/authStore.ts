import { create } from 'zustand';
import type { User } from 'firebase/auth';

type AuthState = {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  isNewLogin: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setIsNewLogin: (isNew: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  authenticated: false,
  isNewLogin: false,
  setUser: (user) => set({ user, authenticated: !!user }),
  setLoading: (loading) => set({ loading }),
  setIsNewLogin: (isNew) => set({ isNewLogin: isNew }),
}));
