import { toast } from "sonner";
import { create } from "zustand";
import type { CreateDevice, Device } from "../device.interface";
import type { Status } from "@/types/status.interface";
import { deviceService } from "./device.service";

interface UserClinicStore {
  data: Device[];
  filteredData: Device[];
  search: string;
  isLoading: boolean;
  fetchFull: () => Promise<void>;
  reload: () => Promise<void>;
  total: number;
  applySearch: (term: string) => void;

  create: (payload: CreateDevice) => Promise<void>;
  update: (id: string, payload: Partial<CreateDevice>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  changeStatus: (id: string, status: Status) => Promise<void>;
  unlink: (deviceId: string) => Promise<void>;
}

export const userDeviceStore = create<UserClinicStore>((set, get) => ({
  data: [],
  filteredData: [],
  total: 0,
  search: "",
  isLoading: false,
  referrals: [],
  referralsLoading: false,

  async fetchFull() {
    set({ isLoading: true });
    try {
      const data = await deviceService.findAll();
      set({
        data,
        filteredData: data,
        isLoading: false,
      });
      get().applySearch(get().search);
    } catch (error) {
      console.error("Error fetching full data", error);
      toast.error("Ha ocurrido un error");
      set({ isLoading: false });
    }
  },

  applySearch(term) {
    set({ search: term });
    const { data, search } = get();
    const filtered = data.filter((item) => {
      const { serialNumber, model } = item;
      const normalized = search.toLowerCase();

      return (
        serialNumber?.toLowerCase().includes(normalized) ||
        model?.toLowerCase().includes(normalized)
      );
    });
    set({ filteredData: filtered });
  },

  async create(payload) {
    const created = await deviceService.create(payload);
    const { data } = get();
    set({
      data: [created, ...data],
      total: data.length + 1,
    });
    get().applySearch(get().search);
    toast.success("Paciente creado");
  },

  async reload() {
    get().applySearch(get().search);
  },

  async update(id, payload) {
    const updated = await deviceService.update(id, payload);
    console.log(updated);
    const { data } = get();
    const updatedData = data.map((item) => (item.id == id ? updated : item));
    console.log(updatedData);
    set({ data: updatedData });
    get().reload();
    toast.success("Paciente actualizado");
  },

  async remove(id) {
    try {
      await deviceService.remove(id);
      const { data } = get();
      const updatedData = data.filter((item) => item.id !== id);
      set({
        data: updatedData,
        total: updatedData.length,
      });
      get().reload();
      toast.success("Paciente eliminado");
    } catch (error) {
      console.error(error);
      toast.error("Ha Ocurrido un error");
    }
  },

  async changeStatus(id, status) {
    try {
      const updated = await deviceService.changeStatus(id, status);
      toast.success("Estado modificiado");
      const { data } = get();
      const updatedData = data.map((item) => (item.id === id ? updated : item));
      set({ data: updatedData });
      get().reload();
    } catch (error) {
      console.error(error);
      toast.error("Ha ocurrido un error");
    }
  },
  async unlink(deviceId) {
    try {
      const updated = await deviceService.unlink(deviceId);
      const { data } = get();
      const safeUpdated = {
        ...updated,
        patient: updated?.patient ?? null,
      } as Device;
      const updatedData = data.map((d) =>
        d.id === deviceId ? safeUpdated : d,
      );
      set({ data: updatedData });
      get().reload();
      toast.success("Paciente desvinculado del dispositivo");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo desvincular el paciente");
    }
  },
}));
