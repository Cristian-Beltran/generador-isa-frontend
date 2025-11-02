// modules/Session/data/session.service.ts
import axios from "@/lib/axios";
import type { Session } from "../session.interface";

const BASE_URL = "/sessions";

export const sessionService = {
  // GET /sessions/patient/:patientId  -> devuelve todas las sesiones con todos sus records
  listByPatient: async (patientId: string): Promise<Session[]> => {
    const res = await axios.get(`${BASE_URL}/patient/${patientId}`);
    return res.data;
  },
};
