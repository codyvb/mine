import type { Metadata } from "next";

import { getSession } from "~/auth"
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import Header from '../components/header';
import Nav from '../components/Nav';

export const metadata: Metadata = {
  title: "Grid",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession()
  
  return (
    <html lang="en">
      <body className=" text-white min-h-screen flex flex-col">
        <Providers session={session}>
          <div className="flex flex-col min-h-screen w-full">
            <Header />
            <main className="flex-1 flex flex-col w-full overflow-hidden">
              {children}
            </main>
            <Nav active="home" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
