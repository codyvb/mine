"use client";

import React from 'react';
import Header from '../../components/header';
import Nav from '../../components/Nav';
import { useRouter } from 'next/navigation';

const PrizesPage: React.FC = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden fixed inset-0 safe-height">
      <Header tries={undefined} />
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-mono text-center mb-4">Prizes</h1>
          {/* Prizes content goes here */}
        </div>
        <div className="px-5 pb-10 mt-2 flex flex-col justify-center">
          <Nav active="prizes" />
        </div>
      </div>
    </div>
  );
};

export default PrizesPage;
