'use client';

import { create } from 'zustand';
import { getApiKey, setApiKey, clearApiKey, getUser, setUser, clearUser } from './storage';
import * as api from './api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  apiKey: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  init: () => void;
  login: (email: string, otp: string) => Promise<void>;
  register: (name: string, email: string) => Promise<void>;
  logout: () => void;
  setApiKeyAndUser: (key: string, user: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  apiKey: null,
  user: null,
  isLoading: false,
  error: null,

  init: () => {
    const key = getApiKey();
    const user = getUser();
    set({ apiKey: key, user });
  },

  login: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const { api_key } = await api.recoverAccount(email, otp);
      setApiKey(api_key);
      const user: User = { id: email, name: '', email };
      setUser(user);
      set({ apiKey: api_key, user });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      set({ error: msg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name: string, email: string) => {
    set({ isLoading: true, error: null });
    try {
      const { api_key, user_id } = await api.register(name, email);
      setApiKey(api_key);
      const user: User = { id: user_id, name, email };
      setUser(user);
      set({ apiKey: api_key, user });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      set({ error: msg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    clearApiKey();
    clearUser();
    set({ apiKey: null, user: null });
  },

  setApiKeyAndUser: (key: string, user: User) => {
    setApiKey(key);
    setUser(user);
    set({ apiKey: key, user });
  },
}));

// Initialize auth on app load (client-side only)
if (typeof window !== 'undefined') {
  useAuth.getState().init();
}
