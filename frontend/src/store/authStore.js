import { create } from 'zustand';

const SESSION_KEY = 'bus_tracker_session';

// Load any saved session from localStorage
const loadSavedSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { user: null, token: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, token: null };
  }
};

const saved = loadSavedSession();

const useAuthStore = create((set) => ({
  user: saved.user,
  token: saved.token,
  isAuthenticated: !!saved.user,
  loading: false,
  error: null,

  setAuth: (user, token) => {
    // Persist to localStorage so page refresh keeps the session
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
    set({ user, token, isAuthenticated: true, error: null });
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
