import React, { useEffect, useState } from "react";

interface CountdownToResetProps {
  nextReset: string | null;
  onReset?: () => void;
}

function getTimeLeft(nextReset: string | null): { hours: number; minutes: number; seconds: number } {
  if (!nextReset) return { hours: 0, minutes: 0, seconds: 0 };
  const reset = new Date(nextReset).getTime();
  const now = Date.now();
  let diff = Math.max(0, Math.floor((reset - now) / 1000));
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  return { hours, minutes, seconds };
}

const CountdownToReset: React.FC<CountdownToResetProps> = ({ nextReset, onReset }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(nextReset));

  useEffect(() => {
    if (!nextReset) return;
    let called = false;
    const interval = setInterval(() => {
      const t = getTimeLeft(nextReset);
      setTimeLeft(t);
      if (!called && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
        called = true;
        if (typeof onReset === 'function') onReset();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextReset, onReset]);

  if (!nextReset) return null;

  const { hours, minutes, seconds } = timeLeft;
  return (
    <div className="flex flex-col items-center justify-center py-6 px-6 rounded-lg bg-neutral-800 text-white font-bold text-lg w-full mx-auto">
      <span className="mt-1 text-base font-normal text-neutral-300">Next play in {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</span>
    </div>
  );
};

export default CountdownToReset;
