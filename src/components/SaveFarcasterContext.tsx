"use client";
import { useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

export default function SaveFarcasterContext() {
  useEffect(() => {
    async function saveContext() {
      try {
        const context = await sdk.context;
        await fetch("/api/save-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: context.user,
            location: context.location,
            client: context.client,
          }),
        });
      } catch (e) {
        // Optionally handle/report error
      }
    }
    saveContext();
  }, []);
  return null;
}
