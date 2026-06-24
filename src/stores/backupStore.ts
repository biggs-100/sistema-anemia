import { create } from "zustand";
import { backupService } from "@/services/backupService";
import { useAuthStore } from "@/stores/authStore";
import type { Backup } from "@/types";

interface BackupState {
  backups: Backup[];
  loading: boolean;
  creating: boolean;
  restoring: boolean;
  error: string | null;
  lastBackup: Backup | null;

  loadBackups: () => Promise<void>;
  createBackup: () => Promise<Backup>;
  restoreBackup: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useBackupStore = create<BackupState>((set, get) => ({
  backups: [],
  loading: false,
  creating: false,
  restoring: false,
  error: null,
  lastBackup: null,

  loadBackups: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No hay sesión activa", loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const backups = await backupService.list(token);
      set({ backups, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar backups";
      set({ error: message, loading: false });
    }
  },

  createBackup: async (): Promise<Backup> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ creating: true, error: null });
    try {
      const backup = await backupService.create(token);
      await get().loadBackups();
      set({ creating: false, lastBackup: backup });
      return backup;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear backup";
      set({ error: message, creating: false });
      throw err;
    }
  },

  restoreBackup: async (id: number) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No hay sesión activa");

    set({ restoring: true, error: null });
    try {
      await backupService.restore(token, id);
      set({ restoring: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al restaurar backup";
      set({ error: message, restoring: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
