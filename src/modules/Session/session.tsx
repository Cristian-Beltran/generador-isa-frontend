import { DashboardHeader } from "@/components/headerPage";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { sessionStore } from "./data/session.store";
import { useEffect } from "react";
import { SessionsTable } from "./components/sessions-table";
import { SessionCharts } from "./components/session-chars";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchByPatient } = sessionStore();

  useEffect(() => {
    if (id) fetchByPatient(id);
  }, [id, fetchByPatient]);

  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title="Sessiones del paciente"
          description="registro de sessiones"
          actions={
            <>
              <Button
                size={"icon"}
                variant="outline"
                onClick={() => console.log("recargar")}
                title="Recargar"
              >
                <RotateCcw />
              </Button>
            </>
          }
        ></DashboardHeader>
      </div>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="charts">Gráficas</TabsTrigger>
            <TabsTrigger value="table">Tabla de Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <SessionCharts />
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Datos Detallados de Sesiones</CardTitle>
                <CardDescription>
                  Todas las sesiones y registros del paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SessionsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
