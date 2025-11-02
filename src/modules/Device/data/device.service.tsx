import axios from "@/lib/axios"; // ajusta el path a tu configuración
import type { CreateDevice, Device } from "../device.interface";
import type { Status } from "@/types/status.interface";

const BASE_URL = "/devices";
export const deviceService = {
  create: async (data: CreateDevice): Promise<Device> => {
    const res = await axios.post(BASE_URL, data);
    return res.data;
  },
  findAll: async (): Promise<Device[]> => {
    const res = await axios.get(BASE_URL);
    return res.data;
  },

  findOne: async (id: string): Promise<Device> => {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateDevice>): Promise<Device> => {
    const res = await axios.put(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  changeStatus: async (id: string, status: Status): Promise<Device> => {
    const res = await axios.patch(`${BASE_URL}/${id}/status`, { status });
    return res.data;
  },
  remove: async (id: string): Promise<void> => {
    const res = await axios.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
  unlink: async (deviceId: string): Promise<Device> => {
    const res = await axios.post(`${BASE_URL}/unlink`, { deviceId });
    return res.data; // asume que el backend devuelve el Device actualizado
  },
};
