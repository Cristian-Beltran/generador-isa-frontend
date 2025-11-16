import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/headerPage";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { sessionStore } from "./data/session.store";
import { patientService } from "@/modules/Patient/data/patient.service"; // ajusta ruta

import type { Session } from "./session.interface";
import type { Patient } from "@/modules/Patient/patient.interface";
import { useAuthStore } from "@/auth/useAuth";

export default function SessionPage() {
  const { id: routePatientId } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { sessions, fetchByPatient } = sessionStore();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAndLoad = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      let patientId: string | undefined = routePatientId;
      let patientData: Patient | null = null;

      // Si no viene id por ruta y el usuario logueado es paciente, lo resolvemos por su user.id
      if (!patientId && user?.id && user?.type === "patient") {
        patientData = await patientService.findOne(user.id);
        patientId = patientData?.id;
      }

      // Si tenemos patientId, intentamos traer el paciente por ID (sobrescribe patientData si aplica)
      if (patientId) {
        patientData =
          (await patientService.findOne(patientId).catch(() => null)) ??
          patientData;
      }

      if (!patientId) {
        setPatient(null);
        setError("No se pudo determinar el paciente.");
        return;
      }

      setPatient(patientData ?? null);

      // Cargar sesiones desde el store
      await fetchByPatient(patientId);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la información del paciente.");
    } finally {
      setLoading(false);
    }
  }, [routePatientId, user?.id, user?.type, fetchByPatient]);

  useEffect(() => {
    void resolveAndLoad();
  }, [resolveAndLoad]);

  const handleReload = async () => {
    setReloading(true);
    await resolveAndLoad();
    setReloading(false);
  };

  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString();
  };

  const computeSessionStats = (session: Session) => {
    if (!session.records || session.records.length === 0) {
      return {
        avgCurrent: null,
        maxCurrent: null,
        avgTemp: null,
        maxTemp: null,
        lastSample: null as (typeof session.records)[number] | null,
      };
    }

    const currents = session.records.map((r) => r.measuredCurrent_mA);
    const temps = session.records.map((r) => r.temperature_C);

    const sumCurrent = currents.reduce((a, b) => a + b, 0);
    const sumTemp = temps.reduce((a, b) => a + b, 0);

    const avgCurrent = sumCurrent / currents.length;
    const avgTemp = sumTemp / temps.length;
    const maxCurrent = Math.max(...currents);
    const maxTemp = Math.max(...temps);

    const lastSample = session.records[session.records.length - 1];

    return {
      avgCurrent,
      maxCurrent,
      avgTemp,
      maxTemp,
      lastSample,
    };
  };

  const shortId = (id: string) => id.slice(0, 8);

  return (
    <>
      <div className="space-y-6">
        <DashboardHeader
          title={
            patient
              ? `Sesiones de ${patient.user.fullname}`
              : "Sesiones del paciente"
          }
          description="Registro de sesiones de estimulación y telemetría (corriente y temperatura)."
          actions={
            <>
              <Button
                size="icon"
                variant="outline"
                onClick={handleReload}
                title="Recargar"
                disabled={loading || reloading}
              >
                <RotateCcw className={reloading ? "animate-spin" : ""} />
              </Button>
            </>
          }
        />
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {loading && (
          <Card>
            <CardHeader>
              <CardTitle>Cargando sesiones...</CardTitle>
              <CardDescription>
                Procesando la información del paciente.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && !error && sessions.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sin sesiones registradas</CardTitle>
              <CardDescription>
                Aún no se han registrado sesiones para este paciente.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="space-y-4">
            {sessions.map((session) => {
              const { avgCurrent, maxCurrent, avgTemp, maxTemp, lastSample } =
                computeSessionStats(session);

              return (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Sesión #{shortId(session.id)}</CardTitle>
                        <CardDescription>
                          Dispositivo: {session.device?.serialNumber ?? "N/D"} ·
                          Duración planificada: {session.durationSeconds} s ·
                          Corriente objetivo: {session.targetCurrent_mA} mA
                        </CardDescription>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        <div>Inicio: {formatDateTime(session.startedAt)}</div>
                        <div>Fin: {formatDateTime(session.endedAt)}</div>
                        <div>
                          Muestras: {session.records?.length ?? 0} (1 Hz)
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Resumen numérico simple */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 border rounded-md">
                        <div className="text-xs text-muted-foreground">
                          Corriente promedio
                        </div>
                        <div className="text-base font-semibold">
                          {avgCurrent !== null
                            ? `${avgCurrent.toFixed(1)} mA`
                            : "-"}
                        </div>
                      </div>
                      <div className="p-3 border rounded-md">
                        <div className="text-xs text-muted-foreground">
                          Corriente máxima
                        </div>
                        <div className="text-base font-semibold">
                          {maxCurrent !== null
                            ? `${maxCurrent.toFixed(1)} mA`
                            : "-"}
                        </div>
                      </div>
                      <div className="p-3 border rounded-md">
                        <div className="text-xs text-muted-foreground">
                          Temperatura promedio
                        </div>
                        <div className="text-base font-semibold">
                          {avgTemp !== null ? `${avgTemp.toFixed(1)} °C` : "-"}
                        </div>
                      </div>
                      <div className="p-3 border rounded-md">
                        <div className="text-xs text-muted-foreground">
                          Temperatura máxima
                        </div>
                        <div className="text-base font-semibold">
                          {maxTemp !== null ? `${maxTemp.toFixed(1)} °C` : "-"}
                        </div>
                      </div>
                    </div>

                    {/* Última muestra */}
                    {lastSample && (
                      <div className="text-xs text-muted-foreground">
                        Última muestra ({formatDateTime(lastSample.recordedAt)}
                        ):{" "}
                        <span className="font-medium text-foreground">
                          {lastSample.measuredCurrent_mA.toFixed(1)} mA
                        </span>{" "}
                        ·{" "}
                        <span className="font-medium text-foreground">
                          {lastSample.temperature_C.toFixed(1)} °C
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
