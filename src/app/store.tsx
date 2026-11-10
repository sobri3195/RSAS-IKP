import { createContext, useContext, useState, type ReactNode } from "react";
import type { Database, Incident } from "../schemas/models";
import { load, save } from "../services/storage";
interface Context {
  db: Database;
  commit: (next: Database) => boolean;
  notify: (message: string) => void;
  error: string;
  clearError: () => void;
  log: (db: Database, text: string, incidentId?: string) => Database;
  upsert: (i: Incident, text: string) => boolean;
}
const Store = createContext<Context>(null!);
export function Provider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [db, setDb] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const [toast, setToast] = useState("");
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 5000);
  };
  const commit = (next: Database) => {
    if (error) {
      notify("Pulihkan atau reset data melalui Pengaturan sebelum menyimpan.");
      return false;
    }
    try {
      save(next);
      setDb(next);
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    }
  };
  const log = (
    next: Database,
    text: string,
    incidentId: string | null = null,
  ): Database => ({
    ...next,
    activity: [
      {
        id: crypto.randomUUID(),
        incidentId,
        text,
        at: new Date().toISOString(),
        actor: db.settings.role,
      },
      ...next.activity,
    ],
  });
  const upsert = (i: Incident, text: string) =>
    commit(
      log(
        {
          ...db,
          incidents: db.incidents.some((v) => v.id === i.id)
            ? db.incidents.map((v) => (v.id === i.id ? i : v))
            : [i, ...db.incidents],
        },
        text,
        i.id,
      ),
    );
  return (
    <Store.Provider
      value={{
        db,
        commit,
        notify,
        error,
        clearError: () => {
          setError("");
          const result = load();
          setDb(result.data);
          setError(result.error);
        },
        log,
        upsert,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Tutup notifikasi" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </Store.Provider>
  );
}
export const useStore = () => useContext(Store);
