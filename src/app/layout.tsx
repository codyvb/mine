import type { Metadata } from "next";

import { getSession } from "~/auth"
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { FarcasterProvider } from "../components/FarcasterContext";
import Header from '../components/header';

export const metadata: Metadata = {
  title: "Gems",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
    { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32" },
    { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16" },
  ],
  openGraph: {
    title: "Gems",
    images: [
      {
        url: "https://www.gems.rip/card5.png",
        width: 1200,
        height: 630,
        alt: "",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gems",
    images: ["https://www.gems.rip/card5.png"],
  },
  other: {
    'fc:frame': JSON.stringify({
      version: "next",
      imageUrl: "https://www.gems.rip/card8.png",
      aspectRatio: "3:2",
      button: {
        title: "Win Some Gems!",
        action: {
          type: "launch_frame",
          name: "Gems",
          url: "https://gems.rip",
          splashImageUrl: "https://www.gems.rip/icon6.png",
          splashBackgroundColor: "#f7f7f7"
        }
      }
    })
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession()
  
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="text-white min-h-screen">
        <FarcasterProvider>
          <Providers session={session}>
            <div className="min-h-screen w-full">
              <Header />
              <main className="flex-1 flex flex-col w-full overflow-hidden">
                {children}
              </main>
            </div>
          </Providers>
        </FarcasterProvider>
      </body>
    </html>
  );
}
