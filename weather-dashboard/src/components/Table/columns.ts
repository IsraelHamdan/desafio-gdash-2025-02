import type { Hourly } from "@/lib/validations/weather";
import type { ColumnDef, Row } from "@tanstack/react-table";

export type HourlyMetricKey =
  | "temperature"
  | "humidity"
  | "windspeed"
  | "precipitation";

export type HourlyMetricRow = {
  metricKey: HourlyMetricKey;
  label: string;
  unit?: string;
};

export const HOURLY_METRIC_ROWS: HourlyMetricRow[] = [
  { metricKey: "temperature", label: "Temperatura", unit: "°C" },
  { metricKey: "humidity", label: "Umidade do ar", unit: "%" },
  { metricKey: "precipitation", label: "Chuva", unit: "mm" },
  { metricKey: "windspeed", label: "Vento", unit: "kts" },
];

const round = (value: number | undefined, decimals = 0) => {
  if (value == null) return "-";
  return Number(value.toFixed(decimals));
};


type HourlyNumericFields = Pick<Hourly, HourlyMetricKey>;

const formatHour = (value: unknown) => {
  if (value instanceof Date) {
    return value.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // tenta parsear como string
  const date = new Date(value as string);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function createHourlyColumns(
  hourly: Hourly[]
): ColumnDef<HourlyMetricRow>[] {
  const staticColumn: ColumnDef<HourlyMetricRow> = {
    id: "metric",
    header: "",
    cell: ({ row }) => row.original.label,
  };

  const dynamicColumns: ColumnDef<HourlyMetricRow>[] = hourly.map(
    (h, index): ColumnDef<HourlyMetricRow> => ({
      id: `time-${index}`,
      header: () => formatHour(h.time),
      cell: ({ row }: { row: Row<HourlyMetricRow> }) => {
        const key = row.original.metricKey;
        const value = (h as HourlyNumericFields)[key];
        const rounded = round(value);

        return row.original.unit ? `${rounded} ${row.original.unit}` : rounded;
      },
    })
  );


  return [staticColumn, ...dynamicColumns];
}