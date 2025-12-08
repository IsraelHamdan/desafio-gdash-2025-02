import type { Hourly } from "@/lib/validations/weather";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useMemo } from "react";
import { createHourlyColumns, HOURLY_METRIC_ROWS, type HourlyMetricRow } from "./columns";

type HourlyTableProps = {
  data: Hourly[];
  currentTime: Date;
};

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  return new Date(value as string);
};

const isoDate = (value: unknown): string => {
  const d = toDate(value);
  // "2025-03-01T10:00:00.000Z" -> "2025-03-01"
  return d.toISOString().slice(0, 10);
};

const isSameDayUTC = (a: unknown, b: unknown): boolean => {
  return isoDate(a) === isoDate(b);
};
export default function HourlyTable({ data, currentTime }: HourlyTableProps) {
  const filteredData = useMemo(() => {
    const sameDayData = data.filter((h) => isSameDayUTC(h.time, currentTime));

    if (!sameDayData.length) {
      const firstDay = data[0]?.time;
      if (!firstDay) return [];

      const firstDayData = data.filter((h) => isSameDayUTC(h.time, firstDay));
      return firstDayData;
    }

    return sameDayData;
  }, [data, currentTime]);

  const columns = useMemo(
    () => createHourlyColumns(filteredData),
    [filteredData]
  );

  const table = useReactTable<HourlyMetricRow>({
    data: HOURLY_METRIC_ROWS,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });



  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum dado horário disponível.
      </p>
    );
  }


  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum dado horário disponível.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-center">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="text-center">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}