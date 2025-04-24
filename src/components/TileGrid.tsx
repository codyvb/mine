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
  flameBurst?: boolean;
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
  flameBurst = false,
}) => {
  return (
    <>
      {/* Grid Section with rounded corners and overflow clipping */}
      <div className="relative rounded-lg overflow-hidden bg-[#534427] mx-4 mt-5 flex flex-col items-center justify-center">
        {/* Fun flame burst overlay */}
        {flameBurst && (
          <div className="absolute inset-0 z-30 pointer-events-none animate-flames-burst flex items-end justify-center">
            <svg width="100%" height="100%" viewBox="0 0 400 400" className="w-full h-full">
              <g>
                <ellipse cx="200" cy="390" rx="180" ry="30" fill="#ffb347" opacity="0.7">
                  <animate attributeName="rx" values="180;220;180" dur="1s" repeatCount="indefinite" />
                </ellipse>
                <g>
                  <path d="M120 380 Q140 320 200 370 Q260 320 280 380 Z" fill="#ff7300" opacity="0.8">
                    <animate attributeName="d" values="M120 380 Q140 320 200 370 Q260 320 280 380 Z;M110 390 Q160 300 200 370 Q240 300 290 390 Z;M120 380 Q140 320 200 370 Q260 320 280 380 Z" dur="1.2s" repeatCount="indefinite" />
                  </path>
                  <path d="M170 380 Q200 300 230 380 Z" fill="#ffd700" opacity="0.7">
                    <animate attributeName="d" values="M170 380 Q200 300 230 380 Z;M160 380 Q200 310 240 380 Z;M170 380 Q200 300 230 380 Z" dur="1.2s" repeatCount="indefinite" />
                  </path>
                  <path d="M190 380 Q200 340 210 380 Z" fill="#fffbe0" opacity="0.6">
                    <animate attributeName="d" values="M190 380 Q200 340 210 380 Z;M185 380 Q200 350 215 380 Z;M190 380 Q200 340 210 380 Z" dur="1.2s" repeatCount="indefinite" />
                  </path>
                </g>
              </g>
            </svg>
          </div>
        )}
        <div className="flex flex-col items-center justify-center flex-grow w-full">
          <div className="h-[200px] mb-[-100px] w-full bg-center bg-cover" style={{ backgroundImage: "url('/fathorse3.png')" }}></div>
          <div key={gameKey} className="grid grid-cols-5 gap-2 w-full max-w-[90vw] mx-4 px-4 py-4 aspect-square">

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
              <div className="flex flex-row flex-nowrap items-center gap-3 w-full min-w-0">
                <span className="flex-1 py-6 px-4 text-white text-xl  text-center whitespace-nowrap flex items-center justify-center">
                  {tries === 0 ? 'No tries left' : `${tries} tries remain`}
                </span>
                <motion.button
                  className="flex-[2] py-6 px-6 rounded-lg font-bold transition-colors min-w-0 truncate block text-center bg-purple-700 text-white hover:bg-purple-600"
                  onClick={handleTryAgain}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={tries === 0}
                >
                  Try Again
                </motion.button>
              </div>
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
                  <div className="animate-pulse flex flex-col items-center justify-center">
                    <svg height="32" viewBox="0 0 40 40" fill="currentColor" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6l-12 14h7v10h10V20h7L20 6z" />
                    </svg>
                    <span className="text-white text-base font-medium mt-2 opacity-80">press a tile to play - {tries === 0 ? 'No tries left' : `${tries} tries remain`}
                    </span>
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

// Add flame burst animation
import '../styles/flames.css';

export default TileGrid;
