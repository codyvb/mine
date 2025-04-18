import { useEffect, useState } from "react";

export function useTriesLeft(fid: number | null) {
  const [triesLeft, setTriesLeft] = useState<number | null>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);

  useEffect(() => {
    if (!fid) {
      setTriesLeft(null);
      setNextReset(null);
      return;
    }
    let cancelled = false;

    async function fetchTries() {
      try {
        const res = await fetch('/api/get-daily-plays');
        const data = await res.json();
        if (!cancelled && res.ok && typeof data.playsLeft === 'number') {
          setTriesLeft(data.playsLeft);
          setNextReset(data.nextReset || null);
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
