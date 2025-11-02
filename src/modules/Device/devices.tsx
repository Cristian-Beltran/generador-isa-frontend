import { DashboardHeader } from "@/components/headerPage";
import TableDevice from "./table/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, RotateCcw } from "lucide-react";
import { userDeviceStore } from "./data/device.store";
import type { Device } from "./device.interface";
import { useState } from "react";
import DeviceFormModal from "./modal-form";

export default function DevicePage() {
  const [selectedUser, setSelectedUser] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchFull } = userDeviceStore();

  const openForCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openForEdit = (user: Device) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title="Dispositivos"
          description="Lista de Dispositivos"
          actions={
            <>
              <Button onClick={openForCreate}>
                <PlusCircle />
                Crear
              </Button>
              <Button
                size={"icon"}
                variant="outline"
                onClick={fetchFull}
                title="Recargar"
              >
                <RotateCcw />
              </Button>
            </>
          }
        ></DashboardHeader>
      </div>

      <div className="p-6 space-y-6">
        <TableDevice onEdit={openForEdit} />
      </div>

      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />
    </>
  );
}
