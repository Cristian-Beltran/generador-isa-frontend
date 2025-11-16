// session.interface.ts
import type { Patient } from "@/modules/Patient/patient.interface";
import type { Device } from "@/modules/Device/device.interface";

export interface SessionData {
  id: string;
  measuredCurrent_mA: number;
  temperature_C: number;
  recordedAt: string; // ISO
}

export interface Session {
  id: string;
  patient: Patient;
  device: Device;
  startedAt: string; // ISO
  endedAt?: string | null;
  durationSeconds: number;
  targetCurrent_mA: number;
  records: SessionData[];
}

/** Payload para crear una sesión */
export interface CreateSessionInput {
  deviceSerial: string;
  durationSeconds: number;
  targetCurrent_mA: number;
}

/** Muestra individual que llega por MQTT y se envía al backend */
export interface SessionDataSampleInput {
  measuredCurrent_mA: number;
  temperature_C: number;
}
