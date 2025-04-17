import { useEffect, useState } from "react";

export function useTriesLeft(fid: number | null) {
  const [triesLeft, setTriesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!fid) {
      setTriesLeft(null);
      return;
    }
    let cancelled = false;

    async function fetchTries() {
      try {
        const res = await fetch('/api/plays-today', { headers: { 'x-fid': String(fid) } });
        const data = await res.json();
        if (!cancelled && res.ok && typeof data.playsToday === 'number') {
          setTriesLeft(Math.max(0, 10 - data.playsToday)); // 10 = DAILY_LIMIT
        }
      } catch {
        if (!cancelled) setTriesLeft(null);
      }
    }

    fetchTries();
    const interval = setInterval(fetchTries, 5000); // poll every 5 seconds
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fid]);

  return triesLeft;
}
