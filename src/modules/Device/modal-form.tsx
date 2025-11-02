import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { Device } from "./device.interface";
import type { Patient } from "@/modules/Patient/patient.interface";
import { userDeviceStore } from "./data/device.store";
import { patientService } from "../Patient/data/patient.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: Device | null;
}

const deviceSchema = z.object({
  serialNumber: z.string().min(2, "Serial requerido"),
  model: z.string().min(1, "Modelo requerido"),
  patientId: z.string().uuid("Paciente inválido"),
});
type DeviceFormValues = z.infer<typeof deviceSchema>;

export default function DeviceFormModal({ isOpen, onClose, user }: Props) {
  const { create, update } = userDeviceStore();

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      serialNumber: "",
      model: "",
      patientId: "",
    },
  });

  // cargar pacientes
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingPatients(true);
      try {
        const data = await patientService.findAll();
        if (mounted) setPatients(data ?? []);
      } finally {
        if (mounted) setLoadingPatients(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // hidratar edición / creación
  useEffect(() => {
    if (user) {
      form.reset({
        serialNumber: user.serialNumber ?? "",
        model: user.model ?? "",
        patientId: user.patient?.id ?? "",
      });
    } else {
      form.reset({
        serialNumber: "",
        model: "",
        patientId: "",
      });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (data: DeviceFormValues) => {
    try {
      if (user) {
        await update(user.id, {
          serialNumber: data.serialNumber,
          model: data.model,
          patientId: data.patientId,
        });
      } else {
        await create({
          serialNumber: data.serialNumber,
          model: data.model,
          patientId: data.patientId,
        });
      }
      onClose();
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        toast.error("Ha ocurrido un error");
        return;
      }
      if (error.response?.status === 400) {
        toast.error("Datos inválidos o duplicados");
        return;
      }
      toast.error(error.response?.data?.message ?? "Error inesperado");
    }
  };

  const patientOptions = patients
    .filter((p) => !p.device || (user?.id && p.device.id === user.id)) // sin device o el mismo device en edición
    .map((p) => ({ value: p.id, label: p.user?.fullname ?? "(Sin nombre)" }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Dispositivo" : "Crear Dispositivo"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial</FormLabel>
                  <FormControl>
                    <Input placeholder="SN-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="Modelo del dispositivo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Select simple de shadcn para paciente */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente vinculado</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingPatients}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingPatients
                              ? "Cargando..."
                              : "Selecciona paciente"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {patientOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {user ? "Editar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
