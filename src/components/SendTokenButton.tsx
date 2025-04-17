import React, { useState } from 'react';
import TokenToast from './TokenToast';

const TO_ADDRESS = '0x40FF52E1848660327F16ED96a307259Ec1D757eB'; // must match API
const AMOUNT = '1'; // always 1 token

import sdk from "@farcaster/frame-sdk";

function SendTokenButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setTxHash(null);
    setShowToast(true); // show toast as soon as attempted
    setAttempted(true);
    try {
      // Get Farcaster user context
      const context = await sdk.context;
      const fid = context?.user?.fid;
      if (!fid) {
        setError('No Farcaster FID found. Please sign in with Farcaster.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/send-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fid': String(fid),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.hash);
        setTxHash(data.hash);
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
    <>
      <div className="mb-4 w-full flex flex-col items-center">
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full max-w-xs mb-2"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'Sending 1 Token...' : 'Send 1 Token'}
        </button>
      </div>
      {showToast && attempted && (
        <TokenToast
          hash={txHash ?? ''}
          amount={AMOUNT}
          to={TO_ADDRESS}
          loading={loading}
          error={error}
          onClose={() => {
            setShowToast(false);
            setAttempted(false);
            setError(null);
            setResult(null);
            setTxHash(null);
          }}
        />
      )}
    </>
  );
}

export default SendTokenButton;
