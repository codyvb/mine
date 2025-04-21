import React, { useEffect, useState } from "react";

import sdk, { AddFrame } from "@farcaster/frame-sdk";

const AddAppButton: React.FC = () => {
  const [canAdd, setCanAdd] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check for sdk.actions.addFrame availability
    if (
      typeof window !== "undefined" &&
      sdk &&
      typeof sdk.actions?.addFrame === "function"
    ) {
      setCanAdd(true);
    }
  }, []);

  const handleAdd = async () => {
    setStatus(null);
    if (!canAdd) return;
    try {
      await sdk.actions.addFrame();
      setStatus("App added successfully!");
    } catch (error: any) {
      if (error instanceof AddFrame.RejectedByUser) {
        setStatus("User rejected adding the app.");
      } else if (error instanceof AddFrame.InvalidDomainManifest) {
        setStatus("Invalid domain manifest. Cannot add app.");
      } else {
        setStatus("Failed to add app.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        className="mt-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg shadow-lg border border-indigo-800 pointer-events-auto transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={handleAdd}
        disabled={!canAdd}
        title={canAdd ? "Add this app to Farcaster" : "Not supported in this environment"}
        type="button"
      >
        Add App
      </button>
      {status && (
        <span className="mt-2 text-sm text-neutral-300 text-center">{status}</span>
      )}
    </div>
  );
};


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
    <div className="flex flex-col items-center justify-center py-6 px-6 rounded-lg text-white text-lg w-full mx-auto">
      {/* Out of tries message at the top */}
      <div className="flex items-center mb-3 h-full justify-center py-2 w-full">
        <h1 className="text-2xl font-mono text-center w-full">Out of Tries</h1>
      </div>
      {/* 5x5 grid of tiles with floating timer */}
      <div className="relative w-full max-w-[90vw] aspect-square mb-4">
        {/* Floating timer centered over grid */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <span className="bg-black/70 px-4 py-2 rounded-xl text-2xl font-semibold text-white shadow-lg border border-neutral-700 mb-4 pointer-events-auto">
            Next play in {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </span>
          {/* Add App Button below timer */}
          <AddAppButton />
        </div>
        <div className="grid grid-cols-5 gap-2 w-full h-full">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="aspect-square w-full h-full bg-neutral-800 rounded-lg border border-neutral-700"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountdownToReset;
