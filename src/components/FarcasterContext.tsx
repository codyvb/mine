"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

interface FarcasterContextProps {
  isConnected: boolean;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  isLoading: boolean;
}

const FarcasterContext = createContext<FarcasterContextProps>({
  isConnected: false,
  fid: null,
  username: null,
  displayName: null,
  pfpUrl: null,
  isLoading: true,
});

export const FarcasterProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadContext() {
      setIsLoading(true);
      try {
        const context = await sdk.context;
        sdk.actions.ready({});
        if (mounted && context?.user) {
          setIsConnected(true);
          setFid(context.user.fid);
          setUsername(context.user.username || null);
          setDisplayName(context.user.displayName || null);
          setPfpUrl(context.user.pfpUrl || null);
        } else {
          setIsConnected(false);
          setFid(null);
          setUsername(null);
          setDisplayName(null);
          setPfpUrl(null);
        }
      } catch {
        if (mounted) setIsConnected(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadContext();
    return () => { mounted = false; };
  }, []);

  return (
    <FarcasterContext.Provider value={{ isConnected, fid, username, displayName, pfpUrl, isLoading }}>
      {children}
    </FarcasterContext.Provider>
  );
};

export const useFarcaster = () => useContext(FarcasterContext);
