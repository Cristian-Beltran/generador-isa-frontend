import type { Patient } from "../Patient/patient.interface";

export interface Device {
  id: string;
  serialNumber: string;
  model: string;
  patient: Patient;
  status: string;
}

export interface CreateDevice {
  serialNumber: string;
  model: string;
  patientId: string;
}
