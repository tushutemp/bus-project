import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => set((state) => ({
    notifications: [
      { ...notification, id: Date.now(), read: false, timestamp: new Date() },
      ...state.notifications
    ],
    unreadCount: state.unreadCount + 1
  })),

  markAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ),
    unreadCount: state.unreadCount - 1
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(notif => ({ ...notif, read: true })),
    unreadCount: 0
  })),

  removeNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter(notif => notif.id !== notificationId)
  })),

  clearAll: () => set({ notifications: [], unreadCount: 0 })
}));

export default useNotificationStore;