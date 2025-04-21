import React from 'react';
import SendTokenButton from './SendTokenButton';

const PrizesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
      <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 text-white text-lg font-bold p-1 hover:bg-neutral-800 rounded"
          aria-label="Close"
        >
          ×
        </button>
        <h1 className="text-4xl flex items-center justify-center mb-6">💎</h1>

        {/* Featured section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-left">Featured</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-600 shadow-lg flex-shrink-0">
              <img
                src="/tokens/horse.png"
                alt="Gem Horse"
                className="w-full h-full object-cover"
              />
            </div>
            <a
              href="https://zora.co/coin/base:0x831f74f796f2f79d65ac5cdc6e813d807d9de54b"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              aria-label="View horse token on Zora"
              className="text-purple-400 hover:underline text-sm font-mono break-all"
            >
              View on Zora ↗
            </a>
          </div>
        </div>

        {/* About section */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold mb-2 text-left">About</h2>
          <p className="text-sm text-neutral-300">We are a new game for Farcaster.</p>
        </div>
      </div>
    </div>
  );
};

export default PrizesModal;
