"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

function SendTokenButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/send-token', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResult(data.hash);
      } else {
        setError(data.error || 'Error sending token');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 w-full flex flex-col items-center">
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full max-w-xs mb-2"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? 'Sending 1 Token...' : 'Send 1 Token'}
      </button>
      {result && (
        <div className="text-green-400 text-xs break-all">Tx Hash: {result}</div>
      )}
      {error && (
        <div className="text-red-400 text-xs break-all">Error: {error}</div>
      )}
    </div>
  );
}


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
