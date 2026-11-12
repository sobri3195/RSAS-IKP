import { createContext, useContext } from "react";
import type { SessionUser } from "../../shared/report";
export const CommitteeSession = createContext<SessionUser | null>(null);
export function useCommittee() {
  const user = useContext(CommitteeSession);
  if (!user) throw new Error("Committee session provider required");
  return user;
}
