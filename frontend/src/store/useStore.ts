import { create } from 'zustand';
import { Alert, ResponseAction, mockAlerts, mockResponseActions } from '@/data/mockData';

interface SOCStore {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  simulationActive: boolean;
  toggleSimulation: () => void;
  responseActions: ResponseAction[];
  updateActionStatus: (id: string, status: ResponseAction['status']) => void;
  notifications: number;
  incrementNotifications: () => void;
  clearNotifications: () => void;
}

export const useStore = create<SOCStore>((set) => ({
  alerts: mockAlerts,
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts], notifications: state.notifications + 1 })),
  simulationActive: false,
  toggleSimulation: () => set((state) => ({ simulationActive: !state.simulationActive })),
  responseActions: mockResponseActions,
  updateActionStatus: (id, status) =>
    set((state) => ({
      responseActions: state.responseActions.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),
  notifications: 2,
  incrementNotifications: () => set((s) => ({ notifications: s.notifications + 1 })),
  clearNotifications: () => set({ notifications: 0 }),
}));
