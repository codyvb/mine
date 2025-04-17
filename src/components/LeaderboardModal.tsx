import React from 'react';

const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
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
        <h1 className="text-2xl font-mono text-center mb-4">Leaderboard</h1>
        {/* Leaderboard content goes here */}
        <div className="text-neutral-300 text-center">Coming soon...</div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
