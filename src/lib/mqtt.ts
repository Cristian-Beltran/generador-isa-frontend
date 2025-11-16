import mqtt from "mqtt";
// Importa SOLO EL TIPO (no se emite en runtime)
import type { IClientOptions, MqttClient } from "mqtt";

/**
 * URL del broker MQTT sobre WebSocket seguro (HiveMQ Cloud).
 * Se puede sobreescribir con VITE_MQTT_URL si quieres otro entorno.
 *
 * Formato requerido por HiveMQ Cloud para WebSocket:
 * wss://<cluster-url>:8884/mqtt
 */
const DEFAULT_URL =
  import.meta.env.VITE_MQTT_URL ??
  "wss://d74c0da80962471190bf365c1c2282a1.s1.eu.hivemq.cloud:8884/mqtt";

/**
 * Credenciales por defecto para el cliente web.
 * En producción deberías sacarlas de env, pero para pruebas lo dejamos así.
 */
const DEFAULT_USERNAME = import.meta.env.VITE_MQTT_USERNAME ?? "Server";
const DEFAULT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD ?? "Holamundo1";

/**
 * Opciones de conexión para HiveMQ Cloud vía WebSocket seguro.
 */
const opts: IClientOptions = {
  keepalive: 30,
  reconnectPeriod: 2000,
  connectTimeout: 5000,
  clean: true,
  clientId: `web-${
    // crypto.randomUUID solo existe en contextos modernos/seguros
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2)
  }`,
  username: DEFAULT_USERNAME,
  password: DEFAULT_PASSWORD,
  // mqtt.js detecta que es WebSocket por el esquema wss:// en la URL,
  // así que no hace falta poner protocol/host/port aquí.
};

/**
 * Singleton de cliente MQTT.
 */
let _client: MqttClient | null = null;

export function getMqttClient(url = DEFAULT_URL): MqttClient {
  if (_client) return _client;
  _client = mqtt.connect(url, opts);
  return _client;
}

/**
 * Cierra y limpia el singleton (opcional).
 */
export function closeMqttClient() {
  try {
    _client?.end(true);
  } catch {
    console.error("error");
  }
  _client = null;
}
