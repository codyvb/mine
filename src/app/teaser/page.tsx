'use client';

"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFarcaster } from "../../components/FarcasterContext";

export default function TeaserPage() {
  const router = useRouter();
  const { isConnected, isLoading } = useFarcaster();

  if (isLoading) return null; // Or a loading spinner

  if (isConnected) {
    if (typeof window !== "undefined") {
      router.replace("/");
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full ">
      <div className="flex flex-col items-center justify-center  p-8 max-w-xs w-full mx-auto">
        <div className="flex items-center justify-center rounded-2xl ">
          <Image
            src="/icon5.png"
            alt="Gems App Icon"
            width={270}
            height={270}
            className="rounded-2xl object-cover"
            priority
          />
        </div>
        <span className="text-2xl mt-2 mb-4 text-white tracking-tight text-center drop-shadow-lg select-none">
          Gems
        </span>
        <hr className="w-[100px] border-t-1 border-dashed border-neutral-400 my-8 opacity-60" />
        <a
          href="https://warpcast.com/gemsgame"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex flex-row items-center justify-center px-8 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-lg shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400  whitespace-nowrap"
        >
          <span className="whitespace-nowrap">Open in Farcaster</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="ml-3 h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
