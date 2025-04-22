// GameModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { sdk } from '@farcaster/frame-sdk';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  winAmount?: number;
  isWin: boolean;
  onTryAgain: () => void;
  grid: { id: number; isMine: boolean; isRevealed: boolean; isAnimating: boolean }[];
  revealedPositions: number[];
}

const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  winAmount = 0,
  isWin,
  onTryAgain,
  grid,
  revealedPositions,
}) => {
  if (!isOpen) return null;

  // Helper to generate Wordle-style emoji grid
  const getEmojiGrid = () => {
    const size = 5;
    let str = '';
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const idx = row * size + col;
        str += revealedPositions.includes(idx) ? '🟩' : '⬜️';
      }
      if (row !== size - 1) str += '\n';
    }
    return str;
  };

  // Compose cast handler for share button
  const handleShare = async () => {
    try {
      await sdk.actions.composeCast({
        text: `I just won some gems on gems.rip\n\n${getEmojiGrid()}`,
        embeds: [
          "https://gems.rip"
        ]
      });
    } catch (e) {
      alert('Failed to open Farcaster compose.');
    }
  };



  return (
    <div className="fixed inset-0 bg-opacity-70 flex items-center justify-center z-50">
      <motion.div 
        className="bg-neutral-800 w-4/5 max-w-md rounded-xl p-6 relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
      >
        {/* Close button */}
        <button 
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center justify-center pt-4 pb-6">
          {isWin ? (
            <>
              <motion.pre
                className="text-2xl mb-2 font-mono leading-tight whitespace-pre text-center"
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ padding: 0, margin: 0 }}
              >
                {getEmojiGrid()}
              </motion.pre>
              <h2 className="text-2xl font-bold text-center mb-2">Congrats!</h2>
              <p className="text-center text-xl mb-6">
                You won <span className="text-green-500 font-bold">{winAmount}</span> $fathorse tokens
              </p>
            </>
          ) : (
            <>
              <motion.div 
                className="text-3xl mb-2"
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                💣
              </motion.div>
              <h2 className="text-2xl font-bold text-center mb-2">So Close!</h2>
              <p className="text-center text-xl mb-6">
                Better luck next time.
              </p>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-4 w-full">
            <motion.button
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 py-3 px-5 rounded-lg font-medium transition-colors"
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Share
            </motion.button>
            <motion.button
              className="flex-1 bg-green-600 hover:bg-green-700 py-3 px-5 rounded-lg font-medium transition-colors"
              onClick={onTryAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameModal;