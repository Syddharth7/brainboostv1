import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    role: null,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setRole: (role) => set({ role }),
    logout: () => set({ user: null, session: null, role: null }),
}));
