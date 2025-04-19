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
        <h1 className="text-2xl font-mono text-center mb-4">Gems</h1>
<div className="flex justify-center mb-4">
  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-600 shadow-lg">
  <a
    href="https://zora.co/coin/base:0x831f74f796f2f79d65ac5cdc6e813d807d9de54b"
    target="_blank"
    rel="noopener noreferrer"
    tabIndex={0}
    aria-label="View horse token on Zora"
  >
    <img
      src="/tokens/horse.png"
      alt="Gem Horse"
      className="w-full h-full object-cover"
    />
  </a>
</div>
</div>
        {/* Prizes content goes here */}
        <div className="px-5 pb-4 mt-2 flex flex-col justify-center w-full max-w-xs mx-auto">
          {/* <SendTokenButton /> */}
        </div>
      </div>
    </div>
  );
};

export default PrizesModal;
