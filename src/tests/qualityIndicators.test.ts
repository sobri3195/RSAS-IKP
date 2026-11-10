import { describe, expect, it } from "vitest";
import {
  qualityIndicators,
  qualitySources,
  type QualityCitation,
} from "../data/qualityIndicators";

describe("Integritas katalog referensi indikator mutu", () => {
  it("mencakup 10 indikator RS dan semua 24 unit dari daftar tanpa kode resmi rekaan", () => {
    expect(
      qualityIndicators.filter((i) => i.scope === "Rumah sakit"),
    ).toHaveLength(10);
    expect(qualityIndicators.filter((i) => i.scope === "Unit")).toHaveLength(
      24,
    );
    expect(new Set(qualityIndicators.map((i) => i.id)).size).toBe(34);
    expect(qualityIndicators.filter((i) => i.code).map((i) => i.code)).toEqual(
      Array.from(
        { length: 10 },
        (_, n) => `IMP-RS-${String(n + 1).padStart(2, "0")}`,
      ),
    );
    expect(
      qualityIndicators
        .filter((i) => i.scope === "Unit")
        .every((i) => i.code === null),
    ).toBe(true);
  });

  it("setiap rujukan mengarah ke halaman yang ada pada salah satu dari tiga PDF", () => {
    const citations: QualityCitation[] = qualityIndicators.flatMap(
      (indicator) => [
        ...indicator.citations,
        ...indicator.targetSources.map((t) => t.citation),
      ],
    );
    expect(citations.length).toBeGreaterThan(34);
    for (const citation of citations) {
      const source = qualitySources[citation.source];
      expect(source).toBeDefined();
      expect(citation.pages.length).toBeGreaterThan(0);
      for (const page of citation.pages) {
        expect(Number.isInteger(page)).toBe(true);
        expect(page).toBeGreaterThanOrEqual(1);
        expect(page).toBeLessThanOrEqual(source.pages);
      }
    }
  });

  it("mempertahankan dua konflik target sebagai nilai sumber berbeda, bukan memilih target aktif", () => {
    const fall = qualityIndicators.find((i) => i.id === "RS-06")!;
    expect(fall.targetSources.map((t) => t.value)).toEqual(["≥95%", "100%"]);
    expect(fall.issues.join(" ")).toContain("Target berbeda");
    const staff = qualityIndicators.find((i) => i.id === "UNIT-SDM")!;
    expect(staff.targetSources.map((t) => t.value)).toEqual(["95%", "100%"]);
    expect(staff.issues.join(" ")).toContain("tanpa operator ≥");
  });

  it("tidak mengarang profil Humas dan menandai variasi nama isolasi", () => {
    const humas = qualityIndicators.find((i) => i.id === "UNIT-HUMAS")!;
    expect(humas.targetSources.map((t) => t.value)).toEqual(["≥85%"]);
    expect(humas.citations).toEqual([{ source: "summary", pages: [3] }]);
    for (const key of [
      "definition",
      "numerator",
      "denominator",
      "formula",
      "inclusion",
      "exclusion",
      "collectionMethod",
      "collectionPeriod",
      "analysisPeriod",
      "dataSource",
      "instrument",
      "sampling",
      "responsibleRole",
    ] as const) {
      expect(humas[key]).toBeNull();
    }
    const isolation = qualityIndicators.find((i) => i.id === "UNIT-ISOLASI")!;
    expect(isolation.unit).toBe("HLIU");
    expect(isolation.issues.join(" ")).toContain("HILU");
  });

  it("katalog tidak memuat data capaian, identitas penandatangan, atau NRP", () => {
    const json = JSON.stringify(qualityIndicators);
    expect(json).not.toMatch(/\bNRP\b|Kolonel|tanda tangan/i);
    for (const indicator of qualityIndicators) {
      expect(indicator).not.toHaveProperty("achievement");
      expect(indicator).not.toHaveProperty("actual");
      expect(indicator).not.toHaveProperty("observations");
      if (indicator.id !== "UNIT-HUMAS") {
        expect(indicator.definition?.length).toBeGreaterThan(20);
        expect(indicator.numerator?.length).toBeGreaterThan(10);
        expect(indicator.denominator?.length).toBeGreaterThan(10);
        expect(indicator.formula).toContain("100%");
      }
    }
  });
});
