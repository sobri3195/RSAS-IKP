import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Empty, Logo } from "../components/ui";
import { api, json, downloadApi } from "../services/api";
import { useCommittee } from "../app/committee-session";
import { useUnits } from "../services/useUnits";
export default function CommitteeTools({
  mode,
}: {
  mode: "qr" | "audit" | "accounts" | "data" | "units";
}) {
  const { units, refresh: refreshUnits } = useUnits();
  const [unitId, setUnitId] = useState("");
  const user = useCommittee(),
    [params] = useSearchParams(),
    [unit, setUnit] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [accounts, setAccounts] = useState<
      {
        id: string;
        name: string;
        email: string;
        enabled: boolean;
        role: string;
      }[]
    >([]),
    [audit, setAudit] = useState<
      {
        id: string;
        action: string;
        at: string;
        actor: string;
        metadata: unknown;
      }[]
    >([]),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [invitation, setInvitation] = useState(""),
    [incoming, setIncoming] = useState<{
      name: string;
      data: unknown;
      kind: "legacy-import" | "backup/restore";
    } | null>(null);
  const query = params.toString();
  const load = async () => {
    try {
      if (mode === "accounts" && user.canManageAccounts)
        setAccounts(await api("/committee/accounts"));
      if (mode === "audit") setAudit(await api(`/committee/audit?${query}`));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
    setIncoming(null);
    setError("");
    setMessage("");
    setInvitation("");
  }, [mode, query]);
  const qr = `/api/committee/qr?format=png${unit ? `&unit=${unit}` : ""}`;
  return (
    <>
      <h1>
        {mode === "qr"
          ? "QR pelaporan langsung"
          : mode === "audit"
            ? "Audit trail pengguna"
            : mode === "accounts"
              ? "Akun Komite Mutu"
              : mode === "units"
                ? "Master unit"
                : "Migrasi & backup"}
      </h1>
      {error && (
        <p className="warning-note" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="info-note" role="status">
          {message}
        </p>
      )}
      {mode === "units" && (
        <Card title="Master unit pelapor">
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api(
                  "/committee/units",
                  json("POST", { id: unitId, name }),
                );
                setUnitId("");
                setName("");
                await refreshUnits();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label className="field">
              Kode unit (huruf kecil, angka, tanda hubung)
              <input
                required
                pattern="[a-z0-9-]{1,80}"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              />
            </label>
            <label className="field">
              Nama unit
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="btn primary">Tambah unit</button>
          </form>
          {units.map((u) => (
            <div className="committee-notice" key={u.id}>
              <b>{u.name}</b>
              <code>{u.id}</code>
              <button
                className="btn secondary"
                onClick={async () => {
                  const name = window.prompt("Nama unit baru", u.name);
                  if (!name) return;
                  try {
                    await api(
                      `/committee/units/${u.id}`,
                      json("PATCH", { name }),
                    );
                    await refreshUnits();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Ubah nama unit
              </button>
            </div>
          ))}
          <p className="muted">
            Kode unit dipertahankan agar QR dan referensi laporan tetap valid.
            Penghapusan unit tidak disediakan untuk menjaga riwayat.
          </p>
        </Card>
      )}
      {mode === "qr" && (
        <Card title="QR standar · PNG dan SVG">
          <label className="field">
            Unit otomatis (dapat dikoreksi pelapor)
            <select
              aria-label="Unit otomatis (dapat dikoreksi pelapor)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="">Semua unit / tanpa pilihan awal</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <div className="qr-poster">
            <Logo large />
            <h2>RSAU PROF. DR. ABDULRACHMAN SALEH</h2>
            <h1>SCAN DI SINI</h1>
            <h2>LAPORKAN INSIDEN KESELAMATAN PASIEN</h2>
            <img
              src={qr}
              alt="QR langsung ke formulir pelaporan IKP"
              width={300}
              height={300}
            />
            <p>Buka kamera HP → pindai QR → isi formulir → kirim.</p>
            <p>
              Tanpa login. Laporkan berdasarkan fakta untuk perbaikan pelayanan.
            </p>
            <code>
              {location.origin}/lapor{unit ? `?unit=${unit}` : ""}
            </code>
          </div>
          <div className="button-row">
            {["png", "svg"].map((format) => (
              <button
                className="btn primary"
                key={format}
                onClick={() =>
                  downloadApi(
                    `/committee/qr?format=${format}${unit ? `&unit=${unit}` : ""}`,
                    `rsas-lapor.${format}`,
                  ).catch((e) => setError(e.message))
                }
              >
                Unduh QR {format.toUpperCase()}
              </button>
            ))}
            <button className="btn secondary" onClick={() => window.print()}>
              Cetak poster
            </button>
          </div>
        </Card>
      )}
      {mode === "audit" && (
        <Card title="Aktivitas server · 500 terbaru">
          {audit.length ? (
            audit.map((a) => (
              <div className="committee-notice" key={a.id}>
                <b>{a.action}</b>
                <p>
                  {a.actor || "Sistem / pelapor publik"} ·{" "}
                  {new Date(a.at).toLocaleString("id-ID")}
                </p>
                <pre className="legacy-record">
                  {JSON.stringify(a.metadata, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <Empty />
          )}
          <p className="muted">
            Audit tidak dapat diubah melalui aplikasi. Backup terenkripsi
            mencakup seluruh audit.
          </p>
        </Card>
      )}
      {mode === "accounts" &&
        (user.canManageAccounts ? (
          <>
            <Card title="Undang anggota Komite Mutu">
              <form
                className="form-grid"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  try {
                    const result = await api<{ url: string }>(
                      "/committee/accounts",
                      json("POST", { name, email }),
                    );
                    setInvitation(result.url);
                    setName("");
                    setEmail("");
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <label className="field">
                  Nama
                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="field">
                  Email anggota
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button className="btn primary">Buat undangan 24 jam</button>
              </form>
              {invitation && (
                <div className="info-note">
                  <p>
                    Kirim tautan aktivasi melalui kanal aman institusi. Penerima
                    menetapkan kata sandi dan MFA sendiri.
                  </p>
                  <code className="tracking-code">{invitation}</code>
                </div>
              )}
            </Card>
            <Card title="Anggota & status akun">
              {accounts.map((a) => (
                <div className="committee-notice" key={a.id}>
                  <b>{a.name}</b>
                  <span>
                    {a.email} · {a.role} ·{" "}
                    {a.enabled ? "Aktif" : "Belum aktif / dinonaktifkan"}
                  </span>
                  {a.id !== user.id && (
                    <button
                      className="btn secondary"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Nonaktifkan akun dan cabut semua sesinya?",
                          )
                        )
                          return;
                        try {
                          await api(
                            `/committee/accounts/${a.id}/disable`,
                            json("POST", {}),
                          );
                          await load();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Nonaktifkan & cabut sesi
                    </button>
                  )}
                </div>
              ))}
            </Card>
          </>
        ) : (
          <p role="alert">403 · Kewenangan pengelolaan akun diperlukan.</p>
        ))}
      {mode === "data" && (
        <>
          <Card title="Backup terenkripsi">
            <p>
              Cadangan berisi laporan, foto, arsip impor, dan audit dalam format
              bertanda tangan. Simpan di lokasi privat institusi bersama salinan
              kunci enkripsi yang dikelola terpisah.
            </p>
            <button
              className="btn primary"
              onClick={() =>
                downloadApi(
                  "/committee/backup",
                  "rsas-encrypted-backup.json",
                ).catch((e) => setError(e.message))
              }
            >
              Unduh backup terenkripsi
            </button>
            <p>
              Pemulihan menambah data yang belum ada, tidak menimpa versi
              laporan yang berbeda. Gunakan database pemulihan terpisah untuk
              pemulihan penuh.
            </p>
          </Card>
          <Card title="Impor data lama / pulihkan backup">
            <p>
              Data demo browser lama tetap utuh. Ekspor eksplisit di bawah tidak
              mengirim data sebelum konfirmasi impor. Semua laporan lama masuk
              sebagai Perlu perbaikan untuk ditinjau ulang.
            </p>
            <button
              className="btn secondary"
              onClick={async () => {
                try {
                  const { legacyBackup, rawLegacyBackup } =
                    await import("../services/legacy");
                  const { downloadBlob } = await import("../services/api");
                  let data: string, filename: string;
                  try {
                    data = legacyBackup();
                    filename = "rsas-legacy-v1.json";
                  } catch {
                    data = rawLegacyBackup();
                    filename = "rsas-legacy-raw.json";
                  }
                  downloadBlob(
                    new Blob([data], { type: "application/json" }),
                    filename,
                  );
                  setMessage(
                    "Salinan mentah lama diunduh. Gunakan backup schemaVersion 1 untuk impor; baca panduan migrasi untuk konversi salinan mentah.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Ekspor data browser lama tanpa menghapus
            </button>
            <label className="field">
              Berkas backup JSON (maksimal 3 MB)
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 5000000)
                      throw new Error(
                        "Maksimal 3 MB melalui UI. Gunakan prosedur database untuk backup besar.",
                      );
                    const data = JSON.parse(await file.text());
                    setIncoming({
                      name: file.name,
                      data,
                      kind:
                        data.data?.version === 2
                          ? "backup/restore"
                          : "legacy-import",
                    });
                  } catch (e) {
                    setError((e as Error).message);
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {incoming && (
              <div className="warning-note">
                <p>
                  {incoming.name} ·{" "}
                  {incoming.kind === "legacy-import"
                    ? "Impor append-only, riwayat asli disimpan terenkripsi."
                    : "Verifikasi tanda tangan dan kunci lingkungan sebelum pemulihan."}
                </p>
                <div className="button-row">
                  <button
                    className="btn primary"
                    onClick={async () => {
                      try {
                        const result = await api<{
                          imported?: number;
                          restored?: number;
                        }>(
                          `/committee/${incoming.kind}`,
                          json("POST", incoming.data),
                        );
                        setMessage(
                          `${result.imported ?? result.restored} laporan diproses; data yang ada tidak dihapus.`,
                        );
                        setIncoming(null);
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Konfirmasi{" "}
                    {incoming.kind === "legacy-import" ? "impor" : "pemulihan"}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setIncoming(null)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
