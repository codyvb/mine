'use client';

import App from "./app";
import SaveFarcasterContext from "../components/SaveFarcasterContext";
import { useRouter } from "next/navigation";
import { useFarcaster } from "../components/FarcasterContext";

export default function Home() {
  const router = useRouter();
  const { isConnected, isLoading } = useFarcaster();

  if (isLoading) return null; // Or a loading spinner

  if (!isConnected) {
    if (typeof window !== "undefined") {
      router.replace("/teaser");
    }
    return null;
  }

  return <>
    <SaveFarcasterContext />
    <App />
  </>;

}

