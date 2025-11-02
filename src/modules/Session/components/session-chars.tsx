import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { sessionStore } from "../data/session.store";

export function SessionCharts() {
  const { sessions } = sessionStore();

  const chartData = useMemo(() => {
    return sessions.map((session, index) => {
      const records = session.records ?? [];
      const count = records.length || 1; // evita división por 0

      const sum = (k: keyof (typeof records)[number]) =>
        records.reduce((acc, r) => acc + (Number(r[k]) || 0), 0);

      const avg = (k: keyof (typeof records)[number]) =>
        Number.parseFloat((sum(k) / count).toFixed(2));

      return {
        session: `S${index + 1}`,
        sessionId: session.id.slice(0, 8),
        date: new Date(session.startedAt).toLocaleDateString("es-ES"),
        avgP1: avg("p1"),
        avgP2: avg("p2"),
        avgP3: avg("p3"),
        avgAx: avg("ax"),
        avgAy: avg("ay"),
        avgAz: avg("az"),
        avgGx: avg("gx"),
        avgGy: avg("gy"),
        avgGz: avg("gz"),
      };
    });
  }, [sessions]);

  const pressureConfig = {
    avgP1: { label: "P1 (Talón)", color: "hsl(var(--primary))" },
    avgP2: { label: "P2 (Mediopié)", color: "hsl(var(--secondary))" },
    avgP3: { label: "P3 (Antepié)", color: "hsl(var(--accent))" },
  };

  const accelerationConfig = {
    avgAx: { label: "AX", color: "hsl(var(--primary))" },
    avgAy: { label: "AY", color: "hsl(var(--secondary))" },
    avgAz: { label: "AZ", color: "hsl(var(--accent))" },
  };

  const gyroConfig = {
    avgGx: { label: "GX", color: "hsl(var(--primary))" },
    avgGy: { label: "GY", color: "hsl(var(--secondary))" },
    avgGz: { label: "GZ", color: "hsl(var(--destructive))" },
  };

  if (!sessions.length) {
    return (
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Promedio de Presión por Sesión</CardTitle>
            <CardDescription>Sin datos disponibles</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Promedio de Presión por Sesión</CardTitle>
          <CardDescription>Talón, mediopié y antepié</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pressureConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="session" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgP1"
                  strokeWidth={2}
                  name="P1 (Talón)"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgP2"
                  strokeWidth={2}
                  name="P2 (Mediopié)"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgP3"
                  strokeWidth={2}
                  name="P3 (Antepié)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promedio de Aceleración por Sesión</CardTitle>
          <CardDescription>AX, AY, AZ</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={accelerationConfig}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="session" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgAx"
                  strokeWidth={2}
                  name="AX"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgAy"
                  strokeWidth={2}
                  name="AY"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgAz"
                  strokeWidth={2}
                  name="AZ"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promedio de Giroscopio por Sesión</CardTitle>
          <CardDescription>GX, GY, GZ</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={gyroConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="session" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgGx"
                  strokeWidth={2}
                  name="GX"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgGy"
                  strokeWidth={2}
                  name="GY"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgGz"
                  strokeWidth={2}
                  name="GZ"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
