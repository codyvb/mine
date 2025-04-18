'use client';

export default function TeaserLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 min-h-screen w-full flex flex-col items-center justify-center">
        {children}
      </body>
    </html>
  );
}
