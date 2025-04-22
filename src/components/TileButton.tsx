import React from 'react';
import { motion } from 'framer-motion';

export interface TileButtonProps {
  tile: {
    id: number;
    isMine: boolean;
    isRevealed: boolean;
    isAnimating: boolean;
  };
  index: number;
  isClickedMine: boolean;
  isOtherMine: boolean;
  isSafeTileRevealed: boolean;
  isUnrevealedSafe: boolean;
  onClick: () => void;
  playSound: (type: 'press' | 'click' | 'mine' | 'cash' | 'please' | 'sent') => void;
  gameKey: number;
  safeRevealedCount: number;
  gameOver: boolean;
}

const TileButton: React.FC<TileButtonProps> = ({
  tile,
  index,
  isClickedMine,
  isOtherMine,
  isSafeTileRevealed,
  isUnrevealedSafe,
  onClick,
  playSound,
  gameKey,
  safeRevealedCount,
  gameOver,
}) => {
  // Set opacity for different scenarios
  let opacity = 1;
  if (gameOver) {
    if (isClickedMine || isSafeTileRevealed) {
      opacity = 1;
    } else if (isUnrevealedSafe) {
      opacity = 0.7;
    } else {
      opacity = 0.5;
    }
  }

  return (
    <motion.button
      key={`${gameKey}-${index}`}
      onClick={() => {
        playSound('press');
        onClick();
      }}
      className={
        `aspect-square w-full h-full flex items-center justify-center font-bold relative`
      }
      style={{
        touchAction: 'none',
        opacity,
        padding: 0,
        border: 'none',
        backgroundColor:
          isSafeTileRevealed || isClickedMine || isOtherMine
            ? 'transparent'
            : tile.isAnimating
            ? '#4b5563'
            : '#374151',
        borderRadius:
          isSafeTileRevealed ? '9999px' : '0.5rem',
        boxShadow:
          (!isSafeTileRevealed && !isClickedMine && !isOtherMine)
            ? 'inset 0 -4px 0 rgba(0,0,0,0.3)'
            : undefined,
      }}
    >
      {/* TOKEN REVEAL */}
      {isSafeTileRevealed && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="absolute inset-0"
          style={{
            borderRadius: '9999px',
            backgroundImage: 'url(/tokens/horse.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* UNREVEALED SAFE TILE (show at 70% opacity) */}
      {isUnrevealedSafe && (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '9999px',
            backgroundImage: 'url(/tokens/horse.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
          }}
        />
      )}
      {/* MINE TILE REVEAL */}
      {(isClickedMine || isOtherMine) && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="absolute inset-0 flex items-center justify-center text-2xl"
          style={{
            borderRadius: '0.5rem',
            backgroundColor: '#b91c1c',
            color: 'white',
          }}
        >
          💣
        </motion.div>
      )}
    </motion.button>
  );
};

export default TileButton;
