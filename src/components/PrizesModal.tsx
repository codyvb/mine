import React from 'react';
import SendTokenButton from './SendTokenButton';
import AddAppButton from './AddAppButton';
import ViewProfileButton from './ViewProfileButton';
import useHasAddedApp from './useHasAddedApp';

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
        <h1 className="text-2xl flex items-center justify-center mb-6">Gems</h1>

        {/* Featured section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-left">Featured Prize</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600 shadow-lg flex-shrink-0">
              <img
                src="/tokens/horse.png"
                alt="Gem Horse"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base text-white">$FATHORSE</span>
              <a
                href="https://zora.co/coin/base:0x831f74f796f2f79d65ac5cdc6e813d807d9de54b"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={0}
                aria-label="View horse token on Zora"
                className="text-purple-400 hover:underline text-xs font-mono break-all mt-1"
              >
                View on Zora ↗
              </a>
            </div>
          </div>
        </div>

        {/* About section */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold mb-2 text-left">About</h2>
          <ul className="text-sm text-neutral-300 list-disc list-inside space-y-1">
            Gems is a new daily game on Farcaster. <p></p>
            <li>1 grid full of prizes and bombs.</li>
            <li>Collect as many prizes as you can before hitting a bomb.</li>
            <li>10 tries per day.</li>
          </ul>
        </div>

        {/* Add App and View Profile Buttons */}
        <AddProfileButtons />
      </div>
    </div>
  );
};

// Helper to conditionally render AddAppButton
const AddProfileButtons: React.FC = () => {
  const hasAdded = useHasAddedApp();
  if (hasAdded === null) return null; // Optionally: loading spinner
  return (
    <div className="flex flex-col items-center gap-3 mt-6 w-full">
      {!hasAdded && <AddAppButton />}
      <ViewProfileButton />
    </div>
  );
};

export default PrizesModal;
