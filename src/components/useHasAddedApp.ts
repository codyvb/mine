import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

export default function useHasAddedApp(): boolean | null {
  const [hasAdded, setHasAdded] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkAdded() {
      if (typeof window !== "undefined" && sdk) {
        try {
          const context = await sdk.context;
          if ((context as any)?.frameAdded || (context as any)?.client?.added) {
            if (mounted) setHasAdded(true);
            return;
          }
        } catch {}
        if (mounted) setHasAdded(false);
      }
    }
    checkAdded();
    return () => {
      mounted = false;
    };
  }, []);

  return hasAdded;
}
