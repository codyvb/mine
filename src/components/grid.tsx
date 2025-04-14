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
  showCheckmark?: boolean;
}

const MinesGame: React.FC = () => {
  // Game constants
  const GRID_SIZE = 5;
  const MINE_COUNT = 3;
  const INITIAL_BALANCE = 1000;
  const WAGER_AMOUNT = 10;
  const ANIMATION_DURATION = 600; // ms
  const REVEAL_DELAY = 400; // ms
  
  // Game state
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  // We need gameWon for UI state management even if it's not directly referenced
  const [, setGameWon] = useState(false);
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  const [canCashOut, setCanCashOut] = useState(false);
  const [message, setMessage] = useState('Click on tiles to reveal them!');
  const [gameKey, setGameKey] = useState(0);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIsWin, setModalIsWin] = useState(false);
  const [modalWinAmount, setModalWinAmount] = useState(0);
  
  // Audio state with refs to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef<boolean>(false);
  
  // Initialize audio on user interaction
  const initAudio = () => {
    if (audioInitializedRef.current) return;
    
    try {
      // Using window.AudioContext with fallback for older browsers
      const AudioContextClass = window.AudioContext || 
        // Need to use any type for webkitAudioContext which may not be in all TypeScript definitions
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
        // Higher pitched click
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
        break;
        
      case 'mine':
        // Explosive sound
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
        // Cash register sound (two high notes in sequence)
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
    
    // SIMPLE FIX: Apply CSS to handle mobile browsers properly
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
  // We only want this effect to run once on mount, so we intentionally omit dependencies
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
  
  // Reveal the entire board (used after hitting a mine)
  const revealEntireBoard = (clickedMineIndex: number): void => {
    const updatedGrid = [...grid];
    
    // First, reveal the clicked mine with animation
    updatedGrid[clickedMineIndex].isRevealed = true;
    updatedGrid[clickedMineIndex].isAnimating = false;
    
    // Reveal all other mines with sequential delay and animations
    const otherMines = minePositions.filter(pos => pos !== clickedMineIndex);
    
    // Calculate total animation time for all mines
    const totalMineAnimationTime = otherMines.length * 300;
    
    otherMines.forEach((pos, i) => {
      setTimeout(() => {
        updatedGrid[pos].isRevealed = true;
        setGrid([...updatedGrid]);
        
        // Play another explosion for each mine
        playSound('mine');
      }, (i + 1) * 300);
    });
    
    // Add checkmarks to all safe tiles but DO NOT mark them as revealed
    // This prevents them from changing color but still shows the checkmark
    setTimeout(() => {
      // Create a special grid state for end game display
      const finalGrid = updatedGrid.map((tile, i) => {
        // For mines - they're already properly handled
        if (minePositions.includes(i)) {
          return tile;
        }
        
        // For tiles already revealed by player - keep them green
        if (revealedPositions.includes(i)) {
          return {...tile, isRevealed: true};
        }
        
        // For unclicked safe tiles - DO NOT mark as revealed to keep neutral color
        // but store that they should show a checkmark in a new property
        return {...tile, showCheckmark: true};
      });
      
      setGrid(finalGrid);
    }, totalMineAnimationTime);
    
    // Show modal after all animations complete (with extra delay)
    setTimeout(() => {
      setModalIsWin(false);
      setModalOpen(true);
    }, totalMineAnimationTime + 1000); // Added 1 second (1000ms) for a total of 1.5s delay
  };
  
  // Handle tile click
  const handleTileClick = (index: number): void => {
    // Try to init audio on every interaction
    initAudio();
    
    // Prevent clicks if game is over, tile is already revealed or currently animating
    if (gameOver || revealedPositions.includes(index) || grid[index].isAnimating) return;
    
    const tile = grid[index];
    
    // Start animation but don't reveal yet
    const newGrid = [...grid];
    newGrid[index].isAnimating = true;
    setGrid(newGrid);
    
    // Wait for animation to complete before revealing
    setTimeout(() => {
      if (tile.isMine) {
        // Play mine sound
        playSound('mine');
        
        // Set game over state
        setGameOver(true);
        setBalance(prev => prev - WAGER_AMOUNT);
        setMessage(`Boom! You hit a mine and lost ${WAGER_AMOUNT} credits.`);
        
        // Stop any pending animations on previously selected tiles
        const updatedGrid = [...newGrid].map(tile => ({
          ...tile,
          isAnimating: false
        }));
        setGrid(updatedGrid);
        
        // Reveal the entire board with the clicked mine highlighted first
        revealEntireBoard(index);
        
      } else {
        // Safe tile
        // Play safe sound
        playSound('click');
        
        // Safe tile
        const newRevealedPositions = [...revealedPositions, index];
        const updatedGrid = [...newGrid];
        
        // First immediately show the checkmark after animation but keep the tile gray
        setTimeout(() => {
          updatedGrid[index].isRevealed = true;
          updatedGrid[index].isAnimating = false;
          // Don't add to revealedPositions yet to keep it gray with checkmark
          setGrid([...updatedGrid]);
          
          // Then after a short delay, turn it green by adding to revealedPositions
          setTimeout(() => {
            setRevealedPositions(newRevealedPositions);
            
            // Calculate potential winnings
            const newPotentialWinnings = calculatePayout(newRevealedPositions.length);
            setPotentialWinnings(newPotentialWinnings);
            
            // Enable cash out after at least one safe tile is revealed
            setCanCashOut(true);
            
            setMessage(`Safe! Potential payout: ${newPotentialWinnings} credits.`);
            
            // Check if all safe tiles are revealed (win condition)
            if (newRevealedPositions.length === (GRID_SIZE * GRID_SIZE) - MINE_COUNT) {
              handleCashOut();
            }
          }, 300); // Delay before turning green
        }, REVEAL_DELAY);
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
    // Implement share functionality here
    console.log(modalIsWin 
      ? `Shared: Won ${modalWinAmount} tokens!` 
      : 'Shared: Better luck next time!');
    
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
  
  // This function is used in the UI for restarting the game
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
          <h1 className="text-2xl font-mono text-center">Select a Tile</h1>
        </div>
        
        {/* Grid section - centered with dynamic sizing */}
        <div className="flex items-center justify-center px-4 py-2 flex-grow">
          <div key={gameKey} className="grid grid-cols-5 gap-2 w-full max-w-[90vw] aspect-square">
            {grid.map((tile, index) => (
              <motion.button
                key={`${gameKey}-${index}`}
                className={`aspect-square rounded-md flex items-center justify-center text-lg font-bold 
                  ${tile.isMine && tile.isRevealed
                    ? 'bg-red-500 border-red-700' 
                    : revealedPositions.includes(tile.id)
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-gray-700 hover:bg-gray-600 border-gray-600'} 
                  border-2 transition-colors`}
                onClick={() => handleTileClick(index)}
                whileHover={!tile.isRevealed && !gameOver ? { scale: 1.05 } : undefined}
                whileTap={!tile.isRevealed && !gameOver ? { scale: 0.95 } : undefined}
                style={{ touchAction: 'none' }}
                animate={
                  tile.isAnimating
                    ? { scale: [1, 1.1, 0.95, 1.05, 1], rotate: [0, 5, -5, 3, 0] }
                    : tile.isRevealed
                      ? (tile.isMine
                        ? { scale: [1, 1.2, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] }
                        : { 
                          scale: [1, 1.2, 1], 
                          backgroundColor: ["#1F2937", "#22C55E", "#22C55E"] as any // This is green-500 in hex
                        })
                      : undefined
                }
                transition={{ duration: 0.5 }}
              >
                {(tile.isRevealed || tile.showCheckmark) && (tile.isMine ? '💣' : '✓')}
              </motion.button>
            ))}
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
                Cash Out ({potentialWinnings} credits)
              </motion.button>
            ) : (
              <button
                className="bg-gray-600 py-6 px-6 rounded-lg font-bold w-full mx-auto block opacity-70 cursor-not-allowed text-center"
                disabled
              >
                <i>Select a tile to begin</i>
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