import React, { useEffect, useState } from "react";
import sdk, { AddFrame } from "@farcaster/frame-sdk";

const AddAppButton: React.FC = () => {
  const [canAdd, setCanAdd] = useState(false);
  const [alreadyAdded, setAlreadyAdded] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkAdded() {
      if (typeof window !== "undefined" && sdk) {
        try {
          const context = await sdk.context;
          if ((context as any)?.frameAdded || (context as any)?.client?.added) {
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

    function handleFrameAdded() {
      setAlreadyAdded(true);
    }
    function handleFrameRemoved() {
      setAlreadyAdded(false);
    }

    checkAdded();
    sdk.on?.("frameAdded", handleFrameAdded);
    sdk.on?.("frameRemoved", handleFrameRemoved);

    return () => {
      mounted = false;
      sdk.off?.("frameAdded", handleFrameAdded);
      sdk.off?.("frameRemoved", handleFrameRemoved);
    };
  }, []);

  if (alreadyAdded === null) return null;
  if (alreadyAdded === true) return null;

  const handleAdd = async () => {
    if (!canAdd) return;
    try {
      await sdk.actions.addFrame();
      setStatus("App added successfully!");
      setAlreadyAdded(true);
    } catch (error: any) {
      if (error instanceof AddFrame.RejectedByUser) {
        setStatus("Add rejected by user.");
      } else if (error instanceof AddFrame.InvalidDomainManifest) {
        setStatus("Invalid domain manifest.");
      } else {
        setStatus("Failed to add app.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center mt-4 w-full">
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full max-w-xs border border-purple-800 shadow-lg text-lg disabled:opacity-60 disabled:cursor-not-allowed"
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

export default AddAppButton;
