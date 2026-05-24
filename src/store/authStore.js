import { create } from 'zustand';
import { auth as authApi } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  restoreSession: async () => {
    const token = localStorage.getItem('1sol_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const data = await authApi.me();
      set({ user: data, token, loading: false });
    } catch {
      localStorage.removeItem('1sol_token');
      set({ loading: false });
    }
  },

  login: async (username, password) => {
    const data = await authApi.login({ username, password });
    localStorage.setItem('1sol_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  signup: async (payload) => {
    const data = await authApi.signup(payload);
    localStorage.setItem('1sol_token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  logout: () => {
    localStorage.removeItem('1sol_token');
    set({ user: null, token: null });
  },

  updateUser: (patch) => set(s => ({ user: { ...s.user, ...patch } })),
}));
