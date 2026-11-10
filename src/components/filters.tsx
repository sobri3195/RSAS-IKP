import { useState } from "react";
import { CalendarDays, SlidersHorizontal, RotateCcw } from "lucide-react";
import { subDays, startOfDay } from "date-fns";
import { useStore } from "../app/store";
import type { Incident } from "../schemas/models";
import { kinds } from "../schemas/models";
import { today, fmt } from "../utils/domain";
export function useFilters(source: Incident[]) {
  const [range, setRange] = useState("year"),
    [unit, setUnit] = useState(""),
    [kind, setKind] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(today());
  const now = new Date();
  const items = source.filter((i) => {
    const d = i.incident.incidentDate || fmt(i.createdAt, "yyyy-MM-dd");
    const date = new Date(`${d}T23:59:59`);
    const validRange =
      range === "all" ||
      (range === "today"
        ? d === today()
        : range === "week"
          ? date >= startOfDay(subDays(now, 6))
          : range === "month"
            ? d.slice(0, 7) === today().slice(0, 7)
            : range === "year"
              ? d.slice(0, 4) === today().slice(0, 4)
              : (!start || d >= start) && (!end || d <= end));
    return (
      validRange &&
      (!unit || i.incident.unit === unit) &&
      (!kind || i.incident.kind === kind)
    );
  });
  return {
    items,
    range,
    setRange,
    unit,
    setUnit,
    kind,
    setKind,
    start,
    setStart,
    end,
    setEnd,
    reset: () => {
      setRange("year");
      setUnit("");
      setKind("");
      setStart("");
      setEnd(today());
    },
  };
}
export function Filters({ f }: { f: ReturnType<typeof useFilters> }) {
  const { db } = useStore();
  return (
    <div className="filter-bar">
      <div className="filter-label">
        <SlidersHorizontal size={16} />
        <b>Filter data</b>
      </div>
      <label className="filter-select">
        <CalendarDays size={15} />
        <span className="sr-only">Periode</span>
        <select value={f.range} onChange={(e) => f.setRange(e.target.value)}>
          <option value="today">Hari ini</option>
          <option value="week">7 hari terakhir</option>
          <option value="month">Bulan ini</option>
          <option value="year">Tahun ini</option>
          <option value="all">Semua periode</option>
          <option value="custom">Rentang khusus</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Filter unit</span>
        <select value={f.unit} onChange={(e) => f.setUnit(e.target.value)}>
          <option value="">Semua unit kerja</option>
          {db.units.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Filter jenis</span>
        <select value={f.kind} onChange={(e) => f.setKind(e.target.value)}>
          <option value="">Semua jenis insiden</option>
          {kinds.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      {f.range === "custom" && (
        <div className="date-range">
          <input
            aria-label="Dari tanggal"
            type="date"
            value={f.start}
            onChange={(e) => f.setStart(e.target.value)}
          />
          <span>—</span>
          <input
            aria-label="Sampai tanggal"
            type="date"
            value={f.end}
            onChange={(e) => f.setEnd(e.target.value)}
          />
        </div>
      )}
      <button className="reset-filter" onClick={f.reset}>
        <RotateCcw size={13} />
        Reset
      </button>
    </div>
  );
}
