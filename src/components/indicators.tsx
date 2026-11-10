import { ChevronDown, Activity } from "lucide-react";
import { metrics } from "../utils/domain";
import type { Incident, Action } from "../schemas/models";
export function AdditionalIndicators({
  items,
  actions,
}: {
  items: Incident[];
  actions: Action[];
}) {
  const m = metrics(items);
  const values: [string, number][] = [
    ["Laporan bulan ini", m.month],
    ["Laporan hari ini", m.today],
    ...(["KPC", "KNC", "KTC", "KTD"] as const).map(
      (k) =>
        [k, items.filter((i) => i.incident.kind === k).length] as [
          string,
          number,
        ],
    ),
    [
      "Sentinel terkonfirmasi",
      items.filter((i) => i.incident.sentinel === "Sentinel terkonfirmasi")
        .length,
    ],
    ["Melewati 48 jam", m.late],
    ["Insiden berulang", m.recurring],
    [
      "CAPA belum selesai",
      actions.filter(
        (a) =>
          items.some((i) => i.id === a.incidentId) && a.status !== "Selesai",
      ).length,
    ],
  ];
  return (
    <details className="additional-indicators">
      <summary>
        <Activity size={15} />
        <span>Indikator keselamatan lainnya</span>
        <small>10 indikator · mengikuti filter</small>
        <ChevronDown size={15} />
      </summary>
      <div className="additional-grid">
        {values.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </details>
  );
}
