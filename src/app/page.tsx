'use client';

import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Farcaster Frames v2 Demo",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};


import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isWarpcast() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("warpcast") || ua.includes("farcaster");
}

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (!isWarpcast()) {
      router.replace("/teaser");
    }
  }, [router]);
  return <App />;
}

