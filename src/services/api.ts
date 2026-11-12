import type { SessionUser } from "../../shared/report";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}
let csrf = "";
export const setSession = (user: SessionUser | null) => {
  csrf = user?.csrf || "";
};
async function response(path: string, options: RequestInit = {}) {
  const result = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...options.headers,
    },
  }).catch(() => {
    throw new ApiError(
      0,
      "Koneksi terputus. Isian tetap tersedia; coba kirim kembali setelah koneksi pulih.",
    );
  });
  if (!result.ok) {
    const error = await result
      .json()
      .catch(() => ({ error: "Layanan tidak dapat dihubungi." }));
    if (result.status === 401 && path.startsWith("/committee"))
      window.dispatchEvent(new Event("rsas-session-expired"));
    throw new ApiError(
      result.status,
      error.error || "Permintaan gagal.",
      error.issues,
    );
  }
  return result;
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await response(path, options);
  return res.status === 204 ? (undefined as T) : res.json();
}
export const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export async function downloadApi(path: string, filename: string) {
  downloadBlob(await (await response(path)).blob(), filename);
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
