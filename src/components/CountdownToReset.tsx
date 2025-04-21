import React, { useEffect, useState } from "react";

import sdk, { AddFrame } from "@farcaster/frame-sdk";

const AddAppButton: React.FC = () => {
  const [canAdd, setCanAdd] = useState(false);
  const [alreadyAdded, setAlreadyAdded] = useState<boolean | null>(null); // null = loading, true/false = checked
  const [status, setStatus] = useState<string | null>(null);

  // Run check as early as possible, before rendering button
  useEffect(() => {
    let mounted = true;
    async function checkAdded() {
      if (typeof window !== "undefined" && sdk) {
        try {
          const context = await sdk.context;
          if ((context as any)?.frameAdded) {
            if (mounted) setAlreadyAdded(true);
            return;
          }
        } catch {}
        if (
          sdk &&
          typeof sdk.actions?.addFrame === "function"
        ) {
          if (mounted) setCanAdd(true);
        }
        if (mounted) setAlreadyAdded(false);
      }
    }
    checkAdded();
    return () => { mounted = false; };
  }, []);

  // Do not render anything until we know if alreadyAdded
  if (alreadyAdded === null) return null;
  if (alreadyAdded === true) return null;

  const handleAdd = async () => {
    if (!canAdd) return;
    try {
      await sdk.actions.addFrame();
      setStatus("App added successfully!");
      setAlreadyAdded(true); // Hide button after successful add if context is not updated immediately
    } catch (error: any) {
      if (error instanceof AddFrame.RejectedByUser) {
        // Do not set any status so user can try again
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

// Always treat nextReset as a UTC ISO string from the backend. Never convert to local time.
function getTimeLeft(nextReset: string | null): { hours: number; minutes: number; seconds: number } {
  if (!nextReset) return { hours: 0, minutes: 0, seconds: 0 };
  // Parse as UTC, compare to UTC now
  const reset = Date.parse(nextReset); // Date.parse always interprets Z as UTC
  const now = Date.now(); // always UTC
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
