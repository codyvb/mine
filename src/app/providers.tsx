"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { TriesProvider } from "../components/TriesContext";


const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <TriesProvider>
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </TriesProvider>
    </SessionProvider>
  );
}
