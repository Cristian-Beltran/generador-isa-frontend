import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { Device } from "../device.interface";

export const columns: ColumnDef<Device>[] = [
  {
    accessorKey: "serialNumber",
    header: () => "Numero de serie",
  },
  {
    accessorKey: "model",
    header: () => "Modelo",
  },
  {
    accessorKey: "patient.user.fullname",
    header: () => "Paciente vinculado",
  },

  {
    accessorKey: "status",
    id: "status",
    header: () => "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>
          {status === "ACTIVE" ? "Habilitado" : "Deshabilitado"}
        </Badge>
      );
    },
  },
];
