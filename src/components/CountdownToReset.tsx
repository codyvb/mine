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
    <div className="flex flex-col items-center justify-center py-6 px-6 rounded-lg text-white  text-lg w-full mx-auto">
      {/* 5x5 grid of tiles */}
      <div className=" flex items-center mb-3 h-full justify-center py-2">
          <h1 className="text-2xl font-mono text-center">out of tries</h1>
        </div>
      <div className="grid grid-cols-5 gap-2 w-full max-w-[90vw] aspect-square mb-4">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="aspect-square w-full h-full bg-neutral-800 rounded-lg border border-neutral-700"
          />
        ))}
      </div>
      <span className="mt-3 text-xl font-normal text-neutral-300">Next play in {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</span>
    </div>
  );
};

export default CountdownToReset;
