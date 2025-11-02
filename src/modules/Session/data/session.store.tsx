// modules/Session/data/session.store.ts
import { create } from "zustand";
import { toast } from "sonner";
import type { Session } from "../session.interface";
import { sessionService } from "./session.service";

type SessionStore = {
  sessions: Session[];
  isLoading: boolean;
  fetchByPatient: (patientId: string) => Promise<void>;

  // helpers opcionales para UI
  getSession: (id: string) => Session | undefined;
  clear: () => void;
};

export const sessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isLoading: false,

  async fetchByPatient(patientId) {
    set({ isLoading: true });
    try {
      const data = await sessionService.listByPatient(patientId);
      // el backend ya trae records embebidos
      set({ sessions: data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      toast.error("No se pudieron cargar las sesiones del paciente");
      console.error(e);
    }
  },

  getSession(id) {
    return get().sessions.find((s) => s.id === id);
  },

  clear() {
    set({ sessions: [] });
  },
}));
