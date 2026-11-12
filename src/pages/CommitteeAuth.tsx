import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { api, json, setSession } from "../services/api";
import type { SessionUser } from "../../shared/report";
import { PublicHeader } from "./PublicReport";
import { CommitteeSession } from "../app/committee-session";
export function CommitteeGuard() {
  const [user, setUser] = useState<SessionUser | null>(null),
    [pending, setPending] = useState(true),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const value = await api<SessionUser>("/auth/session");
        if (active) {
          setUser(value);
          setSession(value);
          setError("");
        }
      } catch (e) {
        if (active) {
          setUser(null);
          setSession(null);
          setError((e as Error).message);
        }
      } finally {
        if (active) setPending(false);
      }
    }
    const expired = () => {
      setSession(null);
      setUser(null);
      navigate("/komite/login", { replace: true });
    };
    const visible = () => {
      if (document.visibilityState === "visible") {
        setPending(true);
        void refresh();
      }
    };
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setPending(true);
        void refresh();
      }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("rsas-session-expired", expired);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pageshow", restored);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("rsas-session-expired", expired);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pageshow", restored);
    };
  }, [navigate, location.pathname]);
  if (pending)
    return (
      <div className="loading-state" role="status">
        Memeriksa sesi internal…
      </div>
    );
  if (!user)
    return <Navigate to="/komite/login" replace state={{ message: error }} />;
  if (user.role !== "komite_mutu")
    return (
      <div className="public-page">
        <PublicHeader />
        <main className="report-shell card public-form">
          <h1>403 · Akses ditolak</h1>
          <p>Akun ini tidak memiliki kewenangan Komite Mutu.</p>
          <Logout />
        </main>
      </div>
    );
  return (
    <CommitteeSession.Provider value={user}>
      <Outlet />
    </CommitteeSession.Provider>
  );
}
export function Logout() {
  const navigate = useNavigate(),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="btn secondary"
        onClick={async () => {
          try {
            await api("/auth/logout", json("POST", {}));
            setSession(null);
            navigate("/komite/login", { replace: true });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <LogOut size={16} />
        Keluar
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
export function CommitteeLogin() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [otp, setOtp] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    navigate = useNavigate();
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="report-shell narrow">
        <form
          className="card public-form login-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const user = await api<SessionUser>(
                "/auth/login",
                json("POST", { email, password, otp }),
              );
              setSession(user);
              setPassword("");
              setOtp("");
              navigate("/komite/dashboard", { replace: true });
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="eyebrow">
            <ShieldCheck size={18} /> AKSES INTERNAL
          </span>
          <h1>Komite Mutu</h1>
          <p>Masuk dengan akun institusi dan kode autentikator.</p>
          <label className="field">
            Email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            Kata sandi
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="field">
            Kode autentikator MFA
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>
          {error && (
            <p className="warning-note" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary full-width" disabled={busy}>
            {busy ? "Memeriksa…" : "Masuk ke Komite Mutu"}
          </button>
        </form>
      </main>
    </div>
  );
}
export function CommitteeEnroll() {
  const [invitation] = useState(() => window.location.hash.slice(1)),
    [setup, setSetup] = useState<{
      name: string;
      uri: string;
      secret: string;
    } | null>(null),
    [image, setImage] = useState(""),
    [password, setPassword] = useState(""),
    [otp, setOtp] = useState(""),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    history.replaceState(null, "", location.pathname);
  }, []);
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="report-shell narrow">
        <section className="card public-form">
          <h1>Aktivasi akun & MFA</h1>
          {done ? (
            <>
              <p>
                Akun telah diaktifkan. Tunggu kode autentikator berikutnya
                sebelum masuk.
              </p>
              <a className="btn primary" href="/komite/login">
                Masuk
              </a>
            </>
          ) : (
            <>
              {!setup ? (
                <>
                  <p>
                    Undangan berlaku 24 jam dan hanya dapat digunakan satu kali.
                  </p>
                  <button
                    className="btn primary"
                    onClick={async () => {
                      try {
                        const value = await api<{
                          name: string;
                          uri: string;
                          secret: string;
                        }>("/auth/enroll/start", json("POST", { invitation }));
                        setSetup(value);
                        const qr = await import("qrcode");
                        setImage(
                          await qr.toDataURL(value.uri, {
                            margin: 4,
                            width: 256,
                          }),
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Siapkan autentikator
                  </button>
                </>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await api(
                        "/auth/enroll/complete",
                        json("POST", { invitation, password, otp }),
                      );
                      setSetup(null);
                      setImage("");
                      setPassword("");
                      setOtp("");
                      setDone(true);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <p>
                    {setup.name}, pindai QR menggunakan aplikasi autentikator
                    pribadi Anda.
                  </p>
                  {image && (
                    <img
                      width={256}
                      height={256}
                      src={image}
                      alt="QR pendaftaran autentikator pribadi"
                    />
                  )}
                  <p>
                    Kunci manual:{" "}
                    <code className="tracking-code">{setup.secret}</code>
                  </p>
                  <p>
                    Simpan kunci pemulihan ini di penyimpanan rahasia institusi.
                  </p>
                  <label className="field">
                    Kata sandi baru (minimal 12 karakter)
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Kode autentikator MFA
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </label>
                  <button className="btn primary">Aktifkan akun</button>
                </form>
              )}
              {error && (
                <p className="warning-note" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
