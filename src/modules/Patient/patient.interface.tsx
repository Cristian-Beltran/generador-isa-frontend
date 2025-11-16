import type { User } from "@/types/user.interface";
import type { Device } from "../Device/device.interface";

export interface Patient {
  id: string;
  user: User;
  device?: Device;
}

export interface CreatePatient {
  fullname: string;
  email: string;
  password?: string;
  address?: string;
  deviceId?: string;
}
