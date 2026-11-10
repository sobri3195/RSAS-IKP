import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, GitBranch, ListChecks } from "lucide-react";
import { useStore } from "../app/store";
import { PageHeading, Empty, Grade } from "../components/ui";
import {
  RiskEditor,
  InvestigationEditor,
  CapaEditor,
} from "../components/workbenches";
export default function Workbench({ mode }: { mode: "risk" | "rca" | "capa" }) {
  const { db } = useStore();
  const items = db.incidents.filter((i) => i.status !== "DRAFT");
  const [selected, setSelected] = useState(
    items[mode === "rca" ? 1 : 0]?.id ?? items[0]?.id ?? "",
  );
  const incident = items.find((i) => i.id === selected) ?? items[0];
  const info = {
    risk: {
      title: "Grading Risiko",
      description:
        "Penetapan risiko manual sesuai penilaian petugas berwenang.",
      icon: ShieldCheck,
    },
    rca: {
      title: "Investigasi & RCA",
      description:
        "Pelajari kejadian melalui fakta, Five Whys, dan faktor kontribusi.",
      icon: GitBranch,
    },
    capa: {
      title: "Tindak Lanjut / CAPA",
      description:
        "Pantau tindakan korektif, pencegahan, dan evaluasi efektivitas.",
      icon: ListChecks,
    },
  }[mode];
  return (
    <>
      <PageHeading title={info.title} description={info.description} />
      {!incident ? (
        <Empty
          title="Belum ada laporan terkirim"
          description="Kirim laporan demo untuk memulai alur penanganan."
        >
          <Link to="/laporan/baru" className="btn primary">
            Buat Laporan
          </Link>
        </Empty>
      ) : (
        <>
          <div className="case-selector">
            <span className="kpi-icon blue">
              <info.icon size={21} />
            </span>
            <label className="field">
              <b>Pilih laporan demo</b>
              <select
                value={incident.id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.displayNumber} · {i.incident.title}
                  </option>
                ))}
              </select>
            </label>
            <Grade grade={incident.riskAssessment.grade} />
            <Link className="btn secondary" to={`/laporan/${incident.id}`}>
              Detail
              <ArrowUpRight size={15} />
            </Link>
          </div>
          {mode === "risk" ? (
            <RiskEditor key={incident.id} incident={incident} />
          ) : mode === "rca" ? (
            <InvestigationEditor key={incident.id} incident={incident} />
          ) : (
            <CapaEditor key={incident.id} incident={incident} />
          )}
        </>
      )}
    </>
  );
}
