import { DataTable } from "@/components/table/data-table";
import { columns } from "./columns";
import { useEffect } from "react";
import type { Device } from "../device.interface";
import { userDeviceStore } from "../data/device.store";
import { DeviceRowActions } from "./row-actions";
import DeviceFilter from "./filters";

interface Props {
  onEdit: (device: Device) => void;
}
export default function TableDevice({ onEdit }: Props) {
  const { fetchFull, filteredData, isLoading } = userDeviceStore();
  useEffect(() => {
    fetchFull();
  }, [fetchFull]);
  return (
    <DataTable
      columns={[
        ...columns,
        {
          accessorKey: "actions",
          header: "Opciones",
          enableSorting: false,
          enableColumnFilter: false,
          cell: ({ row }) => (
            <DeviceRowActions item={row.original} onEditUser={onEdit} />
          ),
        },
      ]}
      manualPagination={false}
      data={filteredData}
      isLoading={isLoading}
      toolbarContent={<DeviceFilter />}
    />
  );
}
