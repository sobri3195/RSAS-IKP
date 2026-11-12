import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
export function useUnits() {
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const refresh = useCallback(async () => {
    const result = await api<{ units: { id: string; name: string }[] }>(
      "/public/config",
    );
    setUnits(result.units);
  }, []);
  useEffect(() => {
    void refresh().catch(() => setUnits([]));
  }, [refresh]);
  return { units, refresh };
}
