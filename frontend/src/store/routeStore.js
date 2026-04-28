import { create } from 'zustand';

const useRouteStore = create((set) => ({
  routes: [],
  selectedRoute: null,
  stops: [],
  loading: false,

  setRoutes: (routes) => set({ routes }),
  
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  
  setStops: (stops) => set({ stops }),

  addStop: (stop) => set((state) => ({
    stops: [...state.stops, stop]
  })),

  updateStop: (stopId, updates) => set((state) => ({
    stops: state.stops.map(stop =>
      stop.id === stopId ? { ...stop, ...updates } : stop
    )
  })),

  removeStop: (stopId) => set((state) => ({
    stops: state.stops.filter(stop => stop.id !== stopId)
  })),

  setLoading: (loading) => set({ loading })
}));

export default useRouteStore;