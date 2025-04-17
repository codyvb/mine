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
        <h1 className="text-2xl font-mono text-center mb-4">Prizes</h1>
        {/* Prizes content goes here */}
        <div className="px-5 pb-4 mt-2 flex flex-col justify-center w-full max-w-xs mx-auto">
          <SendTokenButton />
        </div>
      </div>
    </div>
  );
};

export default PrizesModal;
