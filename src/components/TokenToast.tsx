import React from 'react';
import sdk from '@farcaster/frame-sdk';

interface TokenToastProps {
  hash: string;
  amount: string; // e.g., '1'
  to: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

const BASESCAN_URL = 'https://basescan.org/tx/';

const TokenToast: React.FC<TokenToastProps> = ({ hash, amount, to, loading, error, onClose }) => (
  <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 bg-neutral-900 border border-purple-600 shadow-xl rounded-xl px-6 py-4 flex flex-col gap-2 items-start min-w-[320px] max-w-[90vw] animate-fade-in">
    <button
      onClick={onClose}
      className="absolute top-2 right-2 text-neutral-400 hover:text-white text-xl font-bold p-1 rounded focus:outline-none"
      aria-label="Close toast"
      style={{ lineHeight: 1 }}
    >
      ×
    </button>
    {loading ? (
      <div className="flex items-center gap-2">
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent inline-block" />
        <span className="text-purple-300 font-medium">Sending {amount} Token{amount === '1' ? '' : 's'}...</span>
      </div>
    ) : error ? (
      <div className="text-red-400 font-semibold text-sm">{error}</div>
    ) : hash ? (
      <>
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-semibold text-lg">Token Sent!</span>
        </div>
        <div className="text-sm text-neutral-300">
          <span className="font-mono">{amount}</span> token sent to
          <span className="font-mono ml-1">{to.slice(0, 6)}...{to.slice(-4)}</span>
        </div>
        <a
          href={`${BASESCAN_URL}${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 underline hover:text-blue-300 mt-1"
          onClick={e => {
            const url = `${BASESCAN_URL}${hash}`;
            const fc = (typeof window !== 'undefined') ? (window as any).farcaster : undefined;
            const wc = (typeof window !== 'undefined') ? (window as any).Warpcast : undefined;
            if ((fc && typeof fc.openUrl === 'function') || (wc && typeof wc.openUrl === 'function')) {
              e.preventDefault();
              sdk.actions.openUrl(url);
            }
          }}
        >
          View on BaseScan
        </a>
      </>
    ) : null}
  </div>
);

export default TokenToast;
