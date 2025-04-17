"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import SendTokenButton from '../../components/SendTokenButton';

const PrizesPage: React.FC = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-black text-white safe-height">
      <h1 className="text-2xl font-mono text-center mb-4">Prizes</h1>
      {/* Prizes content goes here */}
      <div className="px-5 pb-10 mt-2 flex flex-col justify-center w-full max-w-xs">
        <SendTokenButton />
      </div>
    </div>
  );
};

export default PrizesPage;
