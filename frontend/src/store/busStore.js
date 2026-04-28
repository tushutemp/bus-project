import { create } from 'zustand';

const useBusStore = create((set) => ({
  buses: [],
  selectedBus: null,
  loading: false,
  error: null,

  setBuses: (buses) => set({ buses }),

  // If the bus already exists → update its location.
  // If it's new (driver just came online) → add it to the list.
  // Match by id OR _id to handle MongoDB responses.
  updateBusLocation: (busId, location) => set((state) => {
    const exists = state.buses.some(b => b.id === busId || b._id === busId);
    if (exists) {
      return {
        buses: state.buses.map(bus =>
          (bus.id === busId || bus._id === busId)
            ? { ...bus, id: bus.id || bus._id, location, lastUpdate: new Date().toISOString() }
            : bus
        )
      };
    }
    // location is null means trip ended for an unknown bus — skip
    if (!location) return state;
    // New bus coming online — add minimal entry so marker appears immediately
    return {
      buses: [...state.buses, {
        id: busId,
        _id: busId,
        number: busId.toUpperCase(),
        status: 'active',
        location,
        lastUpdate: new Date().toISOString(),
      }]
    };
  }),

  // Called when server broadcasts full bus object (e.g. on tripStarted)
  upsertBus: (bus) => set((state) => {
    const busId = bus.id || bus._id;
    const exists = state.buses.some(b => b.id === busId || b._id === busId);
    if (exists) {
      return { buses: state.buses.map(b => (b.id === busId || b._id === busId) ? { ...b, ...bus, id: busId } : b) };
    }
    return { buses: [...state.buses, { ...bus, id: busId }] };
  }),

  setSelectedBus: (bus) => set({ selectedBus: bus }),
  addBus:  (bus)    => set((state) => ({ buses: [...state.buses, bus] })),
  removeBus: (busId) => set((state) => ({ buses: state.buses.filter(b => b.id !== busId) })),
  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),
}));

export default useBusStore;
