// modules/Session/data/session.service.ts
import axios from "@/lib/axios";
import type {
  Session,
  CreateSessionInput,
  SessionDataSampleInput,
} from "../session.interface";

const BASE_URL = "/sessions";

export const sessionService = {
  /**
   * GET /sessions?patientId=:patientId
   * Si se pasa patientId, filtra por paciente. Si no, lista todas.
   */
  list: async (patientId?: string): Promise<Session[]> => {
    const res = await axios.get<Session[]>(BASE_URL, {
      params: patientId ? { patientId } : undefined,
    });
    return res.data;
  },

  /**
   * Por compatibilidad con tu naming anterior: listByPatient
   * Internamente usa GET /sessions?patientId=...
   */
  listByPatient: async (patientId: string): Promise<Session[]> => {
    const res = await axios.get<Session[]>(BASE_URL, {
      params: { patientId },
    });
    return res.data;
  },

  /**
   * GET /sessions/:id
   */
  findOne: async (id: string): Promise<Session> => {
    const res = await axios.get<Session>(`${BASE_URL}/${id}`);
    return res.data;
  },

  /**
   * POST /sessions
   * Crea una sesión (modo controlado por frontend/MQTT o por ESP da igual,
   * mientras use este DTO).
   */
  create: async (input: CreateSessionInput): Promise<Session> => {
    const res = await axios.post<Session>(BASE_URL, input);
    return res.data;
  },

  /**
   * POST /sessions/:id/data
   * Agrega telemetría (batch de muestras) a una sesión existente.
   */
  appendData: async (
    sessionId: string,
    payload: SessionDataSampleInput,
  ): Promise<Session> => {
    const res = await axios.post<Session>(
      `${BASE_URL}/${sessionId}/data`,
      payload,
    );
    return res.data;
  },

  /**
   * POST /sessions/:id/close
   * Marca la sesión como cerrada (endedAt se setea en backend).
   */
  close: async (sessionId: string): Promise<Session> => {
    const res = await axios.post<Session>(`${BASE_URL}/${sessionId}/close`);
    return res.data;
  },
};
