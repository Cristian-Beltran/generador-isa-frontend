import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square, Wifi, WifiOff } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAuthStore } from "@/auth/useAuth";
import { patientService } from "@/modules/Patient/data/patient.service";
import { sessionService } from "@/modules/Session/data/session.service";
import { getMqttClient, closeMqttClient } from "@/lib/mqtt";
import type { CreateSessionInput } from "../Session/session.interface";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Tipos auxiliares
type DeviceOption = {
  serialNumber: string;
  patientId: string;
  patientLabel: string;
};

type SampleRow = {
  id: string;
  measuredCurrent_mA: number;
  temperature_C: number;
};

const CURRENT_OPTIONS = [0.5, 1.5, 2, 2.5] as const;
const DURATION_OPTIONS = [
  { label: "10 segundos", value: 10 },
  { label: "1 minuto", value: 60 },
  { label: "2 minutos", value: 120 },
] as const;
type CurrentOption = (typeof CURRENT_OPTIONS)[number];

export default function MonitoringPage() {
  const { user } = useAuthStore();
  const isDoctor = user?.type === "doctor";

  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[]>([]);
  const [selectedSerial, setSelectedSerial] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  const [current_mA, setCurrent_mA] =
    useState<(typeof CURRENT_OPTIONS)[number]>(0.5);
  const [durationSeconds, setDurationSeconds] = useState<number>(60);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  // MQTT
  const mqttClientRef = useRef<ReturnType<typeof getMqttClient> | null>(null);
  const currentTelemetryTopicRef = useRef<string | null>(null);

  // Para usar siempre el último valor dentro de callbacks
  const selectedSerialRef = useRef<string>("");
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedSerialRef.current = selectedSerial;
  }, [selectedSerial]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // ---------------------------------------------------------------------------
  // 1. Cargar pacientes con device para el doctor (selector por serialNumber)
  // ---------------------------------------------------------------------------

  const loadDevicesForDoctor = useCallback(async () => {
    if (!isDoctor) return;

    setLoadingDevices(true);
    try {
      const patients = await patientService.findAll();
      const options: DeviceOption[] = [];

      patients.forEach((p) => {
        if (p.device)
          options.push({
            serialNumber: p.device.serialNumber,
            patientId: p.id,
            patientLabel:
              `${p.user.fullname ?? ""}`.trim() || "Paciente sin nombre",
          });
      });

      setDeviceOptions(options);

      if (options.length > 0 && !selectedSerialRef.current) {
        const first = options[0];
        setSelectedSerial(first.serialNumber);
        setSelectedPatientId(first.patientId);
      }
    } catch (e) {
      console.error("Error cargando pacientes con devices:", e);
    } finally {
      setLoadingDevices(false);
    }
  }, [isDoctor]);

  useEffect(() => {
    if (isDoctor) {
      void loadDevicesForDoctor();
    }
  }, [isDoctor, loadDevicesForDoctor]);

  // ---------------------------------------------------------------------------
  // STOP remoto: cuando el ESP decide terminar la sesión
  // ---------------------------------------------------------------------------

  const handleRemoteStopSession = useCallback(
    async (deviceSessionId?: string) => {
      const activeSessionId = currentSessionIdRef.current;

      if (!activeSessionId) {
        // No hay sesión activa, ignoramos
        return;
      }

      // Si viene sessionId desde el dispositivo y no coincide, lo ignoramos
      if (deviceSessionId && deviceSessionId !== activeSessionId) {
        console.warn(
          "[MQTT] stop recibido para otra sesión. Esperado:",
          activeSessionId,
          "recibido:",
          deviceSessionId,
        );
        return;
      }

      try {
        setClosingSession(true);
        await sessionService.close(activeSessionId);
      } catch (e) {
        console.error("Error cerrando sesión (stop desde ESP):", e);
      } finally {
        setIsRunning(false);
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        setClosingSession(false);
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // 4. Conectarse a MQTT y recibir datos por serialNumber + stop remoto
  // ---------------------------------------------------------------------------

  // Conexión MQTT global de la página
  useEffect(() => {
    const client = getMqttClient();
    mqttClientRef.current = client;

    const handleConnect = () => {
      setIsConnected(true);
      // Suscripción global a stops de todos los devices
      client.subscribe("devices/+/session/stop", (err) => {
        if (err) {
          console.error("Error al suscribirse a devices/+/session/stop", err);
        }
      });
    };

    const handleClose = () => {
      setIsConnected(false);
    };

    const handleError = (err: unknown) => {
      console.error("MQTT error:", err);
    };

    const handleMessage = (topic: string, payload: Buffer) => {
      const serial = selectedSerialRef.current;
      if (!serial) return;

      const telemetryTopic = `devices/${serial}/telemetry`;
      const stopTopic = `devices/${serial}/session/stop`;

      // Telemetría normal
      if (topic === telemetryTopic) {
        try {
          const json = JSON.parse(payload.toString()) as {
            current_mA: number;
            temperature_C: number;
          };

          const sample: SampleRow = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            measuredCurrent_mA: json.current_mA,
            temperature_C: json.temperature_C,
          };

          setSamples((prev) => [...prev, sample]);

          const sessionId = currentSessionIdRef.current;
          if (sessionId) {
            void sessionService.appendData(sessionId, {
              measuredCurrent_mA: json.current_mA,
              temperature_C: json.temperature_C,
            });
          }
        } catch (e) {
          console.error(
            "Error parseando telemetría MQTT:",
            e,
            payload.toString(),
          );
        }
        return;
      }

      // Stop emitido por el ESP
      if (topic === stopTopic) {
        try {
          const json = JSON.parse(payload.toString()) as {
            sessionId?: string;
            reason?: string;
          };

          void handleRemoteStopSession(json.sessionId);
        } catch (e) {
          console.error(
            "Error parseando stop MQTT desde ESP:",
            e,
            payload.toString(),
          );
        }
      }
    };

    client.on("connect", handleConnect);
    client.on("close", handleClose);
    client.on("error", handleError);
    client.on("message", handleMessage);

    return () => {
      client.off("connect", handleConnect);
      client.off("close", handleClose);
      client.off("error", handleError);
      client.off("message", handleMessage);
      closeMqttClient();
      mqttClientRef.current = null;
    };
  }, [handleRemoteStopSession]);

  // Suscribirse al topic correcto de TELEMETRÍA según el serial seleccionado
  useEffect(() => {
    const client = mqttClientRef.current;
    if (!client) return;

    const newSerial = selectedSerialRef.current;
    const newTopic = newSerial ? `devices/${newSerial}/telemetry` : null;
    const prevTopic = currentTelemetryTopicRef.current;

    if (prevTopic && prevTopic !== newTopic) {
      client.unsubscribe(prevTopic, (err) => {
        if (err) console.error("Error al desuscribirse de", prevTopic, err);
      });
    }

    if (newTopic && newTopic !== prevTopic) {
      client.subscribe(newTopic, (err) => {
        if (err) console.error("Error al suscribirse a", newTopic, err);
      });
    }

    currentTelemetryTopicRef.current = newTopic || null;
  }, [selectedSerial]);

  // ---------------------------------------------------------------------------
  // 2. Seleccionar tiempo y corriente, al seleccionar se envía por MQTT
  // ---------------------------------------------------------------------------

  const sendConfigToEsp = useCallback(
    (newCurrent: number, newDuration: number) => {
      const client = mqttClientRef.current;
      const serial = selectedSerialRef.current;
      if (!client || !serial) return;

      const payload = {
        current_mA: newCurrent,
        duration_seconds: newDuration,
      };

      client.publish(`devices/${serial}/config`, JSON.stringify(payload));
    },
    [],
  );

  const handleChangeCurrent = (value: CurrentOption) => {
    setCurrent_mA(value);
    sendConfigToEsp(value, durationSeconds);
  };

  const handleChangeDuration = (value: number) => {
    setDurationSeconds(value);
    sendConfigToEsp(current_mA, value);
  };

  // ---------------------------------------------------------------------------
  // 3. Botón inicio: crear session + enviar comando de inicio al ESP
  // ---------------------------------------------------------------------------

  const handleStartSession = async () => {
    if (!selectedSerial || !selectedPatientId) {
      alert("Selecciona un paciente/dispositivo antes de iniciar.");
      return;
    }

    try {
      setStartingSession(true);
      setSamples([]);

      const dto = {
        deviceSerial: selectedSerial,
        durationSeconds,
        targetCurrent_mA: current_mA,
      } as CreateSessionInput;

      const session = await sessionService.create(dto);

      setCurrentSessionId(session.id);
      currentSessionIdRef.current = session.id;
      setIsRunning(true);

      const client = mqttClientRef.current;
      if (client) {
        const payload = {
          current_mA: current_mA,
          duration_seconds: durationSeconds,
          sessionId: session.id,
        };
        client.publish(
          `devices/${selectedSerial}/session/start`,
          JSON.stringify(payload),
        );
      }
    } catch (e) {
      console.error("Error iniciando sesión:", e);
      alert("No se pudo iniciar la sesión.");
    } finally {
      setStartingSession(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Finalizar sesión: STOP desde frontend + cerrar sesión en backend
  // ---------------------------------------------------------------------------

  const handleStopSession = async () => {
    if (!currentSessionId) {
      setIsRunning(false);
      return;
    }

    try {
      setClosingSession(true);

      const client = mqttClientRef.current;
      if (client && selectedSerialRef.current) {
        const payload = { sessionId: currentSessionId };
        client.publish(
          `devices/${selectedSerialRef.current}/session/stop`,
          JSON.stringify(payload),
        );
      }

      await sessionService.close(currentSessionId);

      setIsRunning(false);
      setCurrentSessionId(null);
      currentSessionIdRef.current = null;
    } catch (e) {
      console.error("Error cerrando sesión (desde frontend):", e);
      alert("No se pudo cerrar la sesión correctamente.");
    } finally {
      setClosingSession(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const selectedDeviceOption = deviceOptions.find(
    (o) => o.serialNumber === selectedSerial,
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Control de Sesión ESP
          </h2>
          <p className="text-muted-foreground">
            Selecciona el paciente por dispositivo (serial), define corriente y
            tiempo, inicia la sesión y visualiza las lecturas recibidas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <Badge className="bg-green-100 text-green-800">
                Conectado al broker
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-400" />
              <Badge variant="secondary">Sin conexión MQTT</Badge>
            </>
          )}
        </div>
      </div>

      {/* CONFIG + CONTROL */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de la sesión</CardTitle>
          <CardDescription>
            La corriente y el tiempo se envían al ESP en cuanto cambias los
            valores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* 1. Seleccionar paciente por serialNumber */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Paciente / Dispositivo (serial)
              </span>
              {isDoctor ? (
                <select
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 min-w-[260px]"
                  disabled={loadingDevices || startingSession || isRunning}
                  value={selectedSerial || ""}
                  onChange={(e) => {
                    const serial = e.target.value;
                    setSelectedSerial(serial);
                    const opt =
                      deviceOptions.find((o) => o.serialNumber === serial) ??
                      null;
                    setSelectedPatientId(opt?.patientId ?? null);
                  }}
                >
                  {deviceOptions.length === 0 ? (
                    <option value="">
                      {loadingDevices
                        ? "Cargando dispositivos..."
                        : "Sin dispositivos disponibles"}
                    </option>
                  ) : (
                    deviceOptions.map((opt) => (
                      <option key={opt.serialNumber} value={opt.serialNumber}>
                        {opt.serialNumber} · {opt.patientLabel}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <span className="text-sm text-muted-foreground">
                  El dispositivo se asigna desde la clínica.
                </span>
              )}
            </div>

            {/* 2. Corriente */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Corriente (mA)
              </span>
              <select
                className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
                disabled={startingSession || closingSession}
                value={current_mA}
                onChange={(e) =>
                  handleChangeCurrent(Number(e.target.value) as CurrentOption)
                }
              >
                {CURRENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c} mA
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tiempo */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Duración</span>
              <select
                className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
                disabled={startingSession || closingSession}
                value={durationSeconds}
                onChange={(e) => handleChangeDuration(Number(e.target.value))}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Botón inicio / 5. Botón finalizar */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {isRunning ? (
                <Button
                  variant="destructive"
                  onClick={handleStopSession}
                  disabled={closingSession}
                >
                  <Square className="mr-2 h-4 w-4" />
                  {closingSession ? "Cerrando sesión..." : "Finalizar sesión"}
                </Button>
              ) : (
                <Button
                  onClick={handleStartSession}
                  disabled={
                    !selectedSerial ||
                    !selectedPatientId ||
                    startingSession ||
                    loadingDevices
                  }
                >
                  <Play className="mr-2 h-4 w-4" />
                  {startingSession ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {currentSessionId
                  ? `Sesión activa: ${currentSessionId.slice(0, 8)}...`
                  : "Sin sesión activa"}
              </span>
            </div>

            {selectedDeviceOption && (
              <div className="text-xs text-muted-foreground">
                Paciente:{" "}
                <span className="font-medium text-foreground">
                  {selectedDeviceOption.patientLabel}
                </span>{" "}
                · Serial:{" "}
                <span className="font-mono">
                  {selectedDeviceOption.serialNumber}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 6. Lista simple y bonita de datos recibidos */}
      <Card>
        <CardHeader>
          <CardTitle>Datos recibidos</CardTitle>
          <CardDescription>
            Corriente y temperatura enviados por el ESP. Cada muestra se guarda
            automáticamente como Session Data.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 📊 NUEVA GRÁFICA DE TEMPERATURA */}
          {samples.length > 0 && (
            <div className="w-full h-56 border rounded-md p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={samples.map((s, i) => ({
                    index: i,
                    temperature: s.temperature_C,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla original */}
          {samples.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no se han recibido lecturas. Inicia una sesión para comenzar a
              ver los datos.
            </p>
          ) : (
            <div className="max-h-80 overflow-auto border rounded-md">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 px-3">Corriente (mA)</th>
                    <th className="py-2 px-3">Temperatura (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-1.5 px-3">
                        {s.measuredCurrent_mA.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-3">
                        {s.temperature_C.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
