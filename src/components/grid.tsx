'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from './header';
import GameModal from './GameModal';

// Define types for our game
interface Tile {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isAnimating: boolean;
}

const MinesGame: React.FC = () => {
  // Keep track of tiles currently being processed to prevent race conditions
  const processingTilesRef = useRef<Set<number>>(new Set());
  // Game constants
  const GRID_SIZE = 5;
  const MINE_COUNT = 3;
  const INITIAL_BALANCE = 1000;
  const WAGER_AMOUNT = 10;
  const ANIMATION_DURATION = 400;
  
  // Game state
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  const [canCashOut, setCanCashOut] = useState(false);
  const [message, setMessage] = useState('Click on tiles to reveal them!');
  const [gameKey, setGameKey] = useState(0);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIsWin, setModalIsWin] = useState(false);
  const [modalWinAmount, setModalWinAmount] = useState(0);
  
  // Keep track of the clicked mine index
  const [clickedMineIndex, setClickedMineIndex] = useState<number | null>(null);
  
  // Audio state with refs to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef<boolean>(false);
  
  // Initialize audio on user interaction
  const initAudio = () => {
    if (audioInitializedRef.current) return;
    
    try {
      // Using window.AudioContext with fallback for older browsers
      const AudioContextClass = window.AudioContext || 
        (window as any).webkitAudioContext;
      
      audioContextRef.current = new AudioContextClass();
      audioInitializedRef.current = true;
      
      // iOS Safari specific: play a silent sound to unlock audio
      playSilentSound();
      
    } catch (e) {
      console.error("Could not create audio context:", e);
    }
  };
  
  // Play a silent sound to unlock audio on iOS
  const playSilentSound = () => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    gainNode.gain.setValueAtTime(0.001, audioContextRef.current.currentTime); // Nearly silent
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.start(0);
    oscillator.stop(audioContextRef.current.currentTime + 0.001);
  };
  
  // Play sounds using a single audio context
  const playSound = (type: 'click' | 'mine' | 'cash') => {
    // Initialize audio if not already done
    if (!audioInitializedRef.current) {
      initAudio();
    }
    
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    // Ensure context is running (needed for Chrome's autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.error("Failed to resume audio context:", e));
    }
    
    // Create oscillator
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure based on sound type
    switch (type) {
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
        break;
        
      case 'mine':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(110, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
        
        // Add noise burst
        setTimeout(() => {
          if (!ctx) return; // Safety check
          
          const noiseNode = ctx.createOscillator();
          const noiseGain = ctx.createGain();
          noiseNode.type = 'sawtooth';
          noiseNode.frequency.setValueAtTime(60, ctx.currentTime);
          noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          noiseNode.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          noiseNode.start();
          noiseNode.stop(ctx.currentTime + 0.2);
        }, 50);
        break;
        
      case 'cash':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1320, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
        
        // Second note
        setTimeout(() => {
          if (!ctx) return; // Safety check
          
          const oscillator2 = ctx.createOscillator();
          const gainNode2 = ctx.createGain();
          oscillator2.type = 'triangle';
          oscillator2.frequency.setValueAtTime(1650, ctx.currentTime);
          gainNode2.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator2.connect(gainNode2);
          gainNode2.connect(ctx.destination);
          oscillator2.start();
          oscillator2.stop(ctx.currentTime + 0.1);
        }, 100);
        break;
    }
  };
  
  // Initialize the game
  useEffect(() => {
    startNewRound();
    
    // Add event listeners for audio initialization
    const handleUserInteraction = () => {
      initAudio();
    };
    
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    
    // Add viewport meta tag to prevent scrolling and zooming
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
    
    // Apply CSS to handle mobile browsers properly
    const style = document.createElement('style');
    style.innerHTML = `
      html, body {
        height: 100%;
        overflow: hidden;
        position: fixed;
        width: 100%;
      }
      
      /* Additional fix for iOS Safari */
      @supports (-webkit-touch-callout: none) {
        .safe-height {
          height: -webkit-fill-available;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Prevent scrolling by handling touchmove events
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    // Cleanup the audio context and event listeners when component unmounts
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Failed to close audio context:", e));
      }
      
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchmove', preventScroll);
      
      // Remove the meta tag and style
      if (meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  
  // Generate a new round
  const startNewRound = (): void => {
    // Create a new grid
    const newGrid = Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, index) => ({
      id: index,
      isMine: false,
      isRevealed: false,
      isAnimating: false
    }));
    
    // Place mines randomly
    const mines: number[] = [];
    while (mines.length < MINE_COUNT) {
      const position = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
      if (!mines.includes(position)) {
        mines.push(position);
        newGrid[position].isMine = true;
      }
    }
    
    // Reset game state
    setGrid(newGrid);
    setMinePositions(mines);
    setRevealedPositions([]);
    setGameOver(false);
    setGameWon(false);
    setPotentialWinnings(0);
    setCanCashOut(false);
    setMessage('Click on tiles to reveal them!');
    setClickedMineIndex(null);
    
    // Increment the key to force re-render
    setGameKey(prevKey => prevKey + 1);
  };
  
  // Calculate payout based on revealed safe tiles
  const calculatePayout = (revealedCount: number): number => {
    if (revealedCount === 0) return 0;
    
    // Simple exponential payout formula
    // The more safe tiles revealed, the higher the multiplier
    const multiplier = 1 + (revealedCount * 0.2);
    return Math.floor(WAGER_AMOUNT * multiplier);
  };
  
  // Handle tile click
  const handleTileClick = (index: number): void => {
    // Try to init audio on every interaction
    initAudio();
    
    // Prevent clicks if game is over, tile is already revealed, or is currently being processed
    if (gameOver || revealedPositions.includes(index) || processingTilesRef.current.has(index)) return;
    
    // Mark this tile as being processed to prevent multiple rapid clicks
    processingTilesRef.current.add(index);
    
    const tile = grid[index];
    
    // Start animation
    const newGrid = [...grid];
    newGrid[index].isAnimating = true;
    setGrid(newGrid);
    
    setTimeout(() => {
      // Stop animation
      const updatedGrid = [...newGrid];
      updatedGrid[index].isAnimating = false;
      updatedGrid[index].isRevealed = true;
      setGrid(updatedGrid);
      
      if (tile.isMine) {
        // Hit a mine
        playSound('mine');
        
        // Record which mine was clicked
        setClickedMineIndex(index);
        
        // Set game over
        setGameOver(true);
        setBalance(prev => prev - WAGER_AMOUNT);
        setMessage(`Boom! You hit a mine and lost ${WAGER_AMOUNT} credits.`);
        
        // Clear the processing list
        processingTilesRef.current.clear();
      } else {
        // Safe tile
        playSound('click');
        
        // Add to revealed positions in a single step
        setRevealedPositions(prev => {
          const newRevealedPositions = [...prev, index];
          
          // Calculate potential winnings
          const newPotentialWinnings = calculatePayout(newRevealedPositions.length);
          setPotentialWinnings(newPotentialWinnings);
          
          // Enable cash out
          setCanCashOut(true);
          
          setMessage(`Safe! Potential payout: ${newPotentialWinnings} credits.`);
          
          // Check if all safe tiles are revealed (win condition)
          if (newRevealedPositions.length === (GRID_SIZE * GRID_SIZE) - MINE_COUNT) {
            handleCashOut();
          }
          
          // Remove this tile from processing list
          processingTilesRef.current.delete(index);
          
          return newRevealedPositions;
        });
      }
    }, ANIMATION_DURATION);
  };
  
  // Handle cash out
  const handleCashOut = (): void => {
    if (!canCashOut || gameOver) return;
    
    // Try to init audio on every interaction
    initAudio();
    
    // Play cashout sound
    playSound('cash');
    
    // Show win modal
    setModalIsWin(true);
    setModalWinAmount(potentialWinnings);
    setModalOpen(true);
    
    setGameWon(true);
    setGameOver(true);
    setBalance(prev => prev + potentialWinnings);
    setMessage(`You cashed out and won ${potentialWinnings} credits!`);
  };
  
  // Modal button handlers
  const handleShareResult = () => {
    // Close modal and start new round
    setModalOpen(false);
    startNewRound();
  };

  const handleTryAgain = () => {
    // Close modal and start new round
    setModalOpen(false);
    startNewRound();
  };
  
  // Handle modal close (X button)
  const handleModalClose = () => {
    // Close modal and start new round
    setModalOpen(false);
    startNewRound();
  };
  
  // Handle new round
  const handleNewRound = (): void => {
    if (!gameOver && revealedPositions.length > 0) {
      // Player forfeits the current round
      setBalance(prev => prev - WAGER_AMOUNT);
      setMessage(`You forfeit and lost ${WAGER_AMOUNT} credits.`);
    }
    
    // Start a new round immediately
    startNewRound();
  };

  // Dummy functions for the bottom buttons
  const handleButton1Click = () => console.log('Button 1 clicked');
  const handleButton2Click = () => console.log('Button 2 clicked');
  const handleButton3Click = () => console.log('Button 3 clicked');
  const handleButton4Click = () => console.log('Button 4 clicked');

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white overflow-hidden fixed inset-0 safe-height">
      <Header />
      
      {/* Main container with fixed proportions */}
      <div className="flex flex-col h-[calc(100%-60px)] justify-between">
        {/* Top section - using relative size for mobile */}
        <div className="bg-black flex items-center h-full justify-center py-4">
          <h1 className="text-2xl font-mono text-center">find some gems</h1>
        </div>
        
        {/* Grid section - centered with dynamic sizing */}
        <div className="flex items-center justify-center px-4 py-2 flex-grow">
          <div key={gameKey} className="grid grid-cols-5 gap-2 w-full max-w-[90vw] aspect-square">
            {grid.map((tile, index) => {
              // Determine if this tile is:
              // 1. The clicked mine
              const isClickedMine = tile.isMine && index === clickedMineIndex && gameOver;
              
              // 2. Another mine that should be shown at reduced opacity when game is over
              const isOtherMine = tile.isMine && gameOver && index !== clickedMineIndex;
              
              // 3. A safe tile that was clicked before game over
              const isSafeTileRevealed = revealedPositions.includes(index);
              
              // 4. A regular unrevealed tile
              const isUnrevealed = !isClickedMine && !isOtherMine && !isSafeTileRevealed;
              
              // Set opacity for different scenarios
              let opacity = 1; // Default full opacity
              
              if (gameOver) {
                if (isClickedMine || isSafeTileRevealed) {
                  // Full opacity for clicked mine and previously revealed safe tiles
                  opacity = 1;
                } else {
                  // Reduced opacity for other mines and unrevealed tiles
                  opacity = 0.3;
                }
              }
              
              // Determine the tile color
              let tileClassName = 'aspect-square rounded-md flex items-center justify-center text-lg font-bold border-2 transition-colors';
              
              if (isClickedMine) {
                // Clicked mine shows as red
                tileClassName += ' bg-red-500 border-red-700';
              } else if (isOtherMine && gameOver) {
                // Other mines also show as red when game is over
                tileClassName += ' bg-red-500 border-red-700';
              } else if (isSafeTileRevealed) {
                // Revealed safe tile shows as green
                tileClassName += ' bg-green-500 border-green-600';
              } else {
                // Unrevealed tiles are gray
                tileClassName += ' bg-gray-700 hover:bg-gray-600 border-gray-600';
              }
              
              return (
                <motion.button
  key={`${gameKey}-${index}`}
  onClick={() => handleTileClick(index)}
  className="aspect-square w-full h-full flex items-center justify-center font-bold relative overflow-hidden"
  style={{
    touchAction: 'none',
    opacity,
    padding: 0,
    border: 'none',
    backgroundColor: isSafeTileRevealed
      ? 'transparent'
      : isClickedMine
      ? '#b91c1c'
      : isOtherMine
      ? '#7f1d1d'
      : '#1f2937',
    borderRadius: isSafeTileRevealed ? '9999px' : '0.5rem',
  }}
  animate={
    tile.isAnimating
      ? {
          scale: [1, 1.08, 0.96, 1],
        }
      : undefined
  }
  transition={{
    duration: 0.4,
    ease: [0.34, 1.56, 0.64, 1],
  }}
>
  {/* 💣 Mine reveal */}
  {(isClickedMine || isOtherMine) && (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-2xl"
    >
      💣
    </motion.div>
  )}

  {/* ✅ Token: full circle background, no border */}
  {isSafeTileRevealed && (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 0.2,
        duration: 0.5,
        type: 'spring',
        stiffness: 500,
        damping: 20,
      }}
      className="absolute inset-0"
      style={{
        borderRadius: '9999px',
        backgroundImage: 'url(/tokens/higher.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )}
</motion.button>






              );
            })}
          </div>
        </div>
        
        {/* Bottom section with auto height */}
        <div className="px-5 pb-10 mt-2 flex flex-col justify-center">
          {/* Cash out button */}
          <div className="mb-3">
            {canCashOut && !gameOver ? (
              <motion.button
                className="bg-green-700 hover:bg-green-600 py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
                onClick={handleCashOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Collect ({potentialWinnings} credits)
              </motion.button>
            ) : gameOver ? (
              <motion.button
                className="bg-purple-700 hover:bg-purple-600 text-white py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
                onClick={startNewRound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again (5 tries left)
              </motion.button>
            ) : (
              <button
                className="bg-gray-600 py-6 px-6 rounded-lg font-bold w-full mx-auto block opacity-70 cursor-not-allowed text-center"
                disabled
              >
                <i>Select to begin</i>
              </button>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex gap-2 w-full mb-3 mx-auto">
            <button 
              className="bg-neutral-600 w-full hover:bg-neutral-700 py-4 rounded-lg transition-colors text-sm"
              onClick={handleButton1Click}
            >
              home
            </button>
            
            <button 
              className="bg-neutral-600 w-full hover:bg-neutral-700 py-4 rounded-lg transition-colors text-sm"
              onClick={handleButton3Click}
            >
              leaderboard
            </button>
            
            <button 
              className="bg-neutral-600 w-full hover:bg-neutral-700 py-4 rounded-lg transition-colors text-sm"
              onClick={handleButton4Click}
            >
              prizes
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal component */}
      <GameModal 
        isOpen={modalOpen}
        onClose={handleModalClose}
        winAmount={modalWinAmount}
        isWin={modalIsWin}
        onTryAgain={handleTryAgain}
        onShare={handleShareResult}
      />
    </div>
  );
};

export default MinesGame;