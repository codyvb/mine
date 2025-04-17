import React, { createContext, useContext, useState, useCallback } from "react";

interface TriesContextType {
  tries: number | null;
  setTries: React.Dispatch<React.SetStateAction<number | null>>;
  fetchTries: (fid: number | null) => Promise<void>;
}

export const TriesContext = createContext<TriesContextType | undefined>(undefined);

export function useTries() {
  const ctx = useContext(TriesContext);
  if (!ctx) throw new Error("useTries must be used within a TriesProvider");
  return ctx;
}

export const TriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tries, setTries] = useState<number | null>(null);

  const fetchTries = useCallback(async (fid: number | null) => {
    if (!fid) return;
    try {
      const res = await fetch('/api/plays-today', { headers: { 'x-fid': String(fid) } });
      const data = await res.json();
      if (res.ok && typeof data.playsToday === 'number') {
        setTries(Math.max(0, 10 - data.playsToday));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <TriesContext.Provider value={{ tries, setTries, fetchTries }}>
      {children}
    </TriesContext.Provider>
  );
};
