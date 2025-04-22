import React from 'react';
import TileButton from './TileButton';
import { motion } from 'framer-motion';

interface Tile {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isAnimating: boolean;
}

interface TileGridProps {
  grid: Tile[];
  revealedPositions: number[];
  minePositions: number[];
  gameOver: boolean;
  safeRevealedCount: number;
  playSound: (type: 'press' | 'click' | 'mine' | 'cash' | 'please' | 'sent') => void;
  handleTileClick: (index: number) => void;
  gameKey: number;
  mineHit: boolean;
  tries: number;
  handleCollect: () => void;
  handleTryAgain: () => void;
  isStartingNewRound?: boolean;
  pendingRevealIndex?: number | null;
}

const TileGrid: React.FC<TileGridProps> = ({
  grid,
  revealedPositions,
  minePositions,
  gameOver,
  safeRevealedCount,
  playSound,
  handleTileClick,
  gameKey,
  mineHit,
  tries,
  handleCollect,
  handleTryAgain,
  isStartingNewRound = false,
  pendingRevealIndex,
}) => {
  return (
    <>
      {/* Header Section */}
      <div className="flex items-center h-full justify-center py-2">
        <h1 className="text-2xl text-center">Win some Gems!</h1>
      </div>
      {/* Grid Section */}
      <div className="flex items-center justify-center px-4 py-2 flex-grow">
        <div key={gameKey} className="grid grid-cols-5 gap-2 w-full max-w-[90vw] aspect-square">
          {grid.map((tile, index) => {
            const isClickedMine = tile.isMine && gameOver; // No distinction needed
            const isOtherMine = false; // No longer used
            const isSafeTileRevealed = revealedPositions.includes(index) && !tile.isMine;
            const isUnrevealedSafe = gameOver && !tile.isMine && !revealedPositions.includes(index);
            const disabled = pendingRevealIndex !== null;
            return (
              <TileButton
                key={`${gameKey}-${index}`}
                tile={tile}
                index={index}
                isClickedMine={isClickedMine}
                isOtherMine={isOtherMine}
                isSafeTileRevealed={isSafeTileRevealed}
                isUnrevealedSafe={isUnrevealedSafe}
                onClick={() => handleTileClick(index)}
                playSound={playSound}
                gameKey={gameKey}
                safeRevealedCount={safeRevealedCount}
                gameOver={gameOver}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
      {/* Footer Section (Collect/Try Again) */}
      {isStartingNewRound ? (
        <div className="px-5 pb-10 mt-2 flex flex-col justify-center" aria-hidden="true">
          <div className="mb-3">
            <div style={{ height: '72px' }} />
          </div>
        </div>
      ) : (
        <div className="px-5 pb-10 mt-2 flex flex-col justify-center">
          <div className="mb-3">
            {mineHit ? (
              <motion.button
                className="bg-purple-700 hover:bg-purple-600 text-white py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
                onClick={handleTryAgain}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={tries === 0}
              >
                {tries === 0 ? 'No tries left' : `Try Again (${tries} tries left)`}
              </motion.button>
            ) : (
              safeRevealedCount > 0 ? (
                <div className="flex flex-row flex-nowrap items-center gap-3 w-full min-w-0">
                  <span className="flex-1 text-white text-xl font-semibold text-center whitespace-nowrap">
                    {safeRevealedCount}/22
                  </span>
                  <motion.button
                    key={`collect-gems-${gameKey}-${safeRevealedCount}`}
                    className={[
                      'flex-[2] py-6 px-6 rounded-lg font-bold transition-colors min-w-0 truncate block text-center',
                      safeRevealedCount < 4
                        ? 'bg-green-700 text-white saturate-75 hover:bg-green-600'
                        : safeRevealedCount < 10
                        ? 'bg-green-600 text-white saturate-100 hover:bg-green-500'
                        : safeRevealedCount < 15
                        ? 'bg-green-500 text-white saturate-150 ring-2 ring-green-300 font-extrabold scale-100 hover:bg-green-400'
                        : 'bg-emerald-400 text-white saturate-200 ring-4 ring-green-300 font-extrabold scale-105 hover:bg-emerald-300',
                    ].join(' ')}
                    style={{
                      maxWidth: '100%',
                      filter: safeRevealedCount < 4 ? 'saturate(0.8) brightness(1)' : safeRevealedCount > 12 ? 'drop-shadow(0 0 16px #34d399)' : undefined,
                      boxShadow: safeRevealedCount > 9 ? '0 0 16px 2px #6ee7b7' : undefined,
                      transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
                    }}
                    onClick={handleCollect}
                    whileHover={{ scale: safeRevealedCount > 3 ? 1.07 : 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={safeRevealedCount < 1}
                  >
                    Collect Gems
                  </motion.button>
                </div>
              ) : (
                <button
                  className="bg-transparent py-6 px-6 rounded-lg font-bold w-full mx-auto flex flex-col items-center justify-center cursor-not-allowed text-center"
                  style={{ height: '72px' }}
                  disabled
                >
                  <div className="animate-pulse">
                    <svg height="32" viewBox="0 0 40 40" fill="currentColor" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6l-12 14h7v10h10V20h7L20 6z" />
                    </svg>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TileGrid;
