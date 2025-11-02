import type { Patient } from "@/modules/Patient/patient.interface";
import type { Device } from "@/modules/Device/device.interface";

export interface SessionData {
  id: string;

  // Presión (5 puntos)
  p1: number; // talón
  p2: number; // mediopié 1
  p3: number; // mediopié 2 / antepié 1
  p4: number; // antepié 2
  p5: number; // antepié 3

  // IMU
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;

  recordedAt: string; // ISO
}

export interface Session {
  id: string;
  patient: Patient;
  device: Device;
  startedAt: string; // ISO
  endedAt?: string | null;
  records: SessionData[]; // backend ya devuelve todos los datos
}
