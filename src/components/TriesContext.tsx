import React, { createContext, useContext, useState, useCallback } from "react";

interface TriesContextType {
  tries: number | null;
  setTries: React.Dispatch<React.SetStateAction<number | null>>;
  fetchTries: (fid: number | null) => Promise<void>;
  nextReset: string | null;
}

export const TriesContext = createContext<TriesContextType | undefined>(undefined);

export function useTries() {
  const ctx = useContext(TriesContext);
  if (!ctx) throw new Error("useTries must be used within a TriesProvider");
  return ctx;
}

export const TriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tries, setTries] = useState<number | null>(null);

  const [nextReset, setNextReset] = useState<string | null>(null);

  const fetchTries = useCallback(async (fid: number | null) => {
    if (!fid) return;
    try {
      const res = await fetch('/api/get-daily-plays', { headers: { 'x-fid': String(fid) } });
      const data = await res.json();
      if (res.ok && typeof data.playsLeft === 'number') {
        setTries(data.playsLeft);
        setNextReset(data.nextReset || null);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <TriesContext.Provider value={{ tries, setTries, fetchTries, nextReset }}>
      {children}
    </TriesContext.Provider>
  );
};
