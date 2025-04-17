import React from 'react';

const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white text-xl font-bold"
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
