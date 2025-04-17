'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const DAILY_LIMIT = 10; // matches backend
import GameModal from './GameModal';
import sdk from '@farcaster/frame-sdk';

// Define types for our game
interface Tile {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isAnimating: boolean;
}

const MinesGame: React.FC = () => {
  const router = useRouter();
  const [triesLeft, setTriesLeft] = useState(DAILY_LIMIT);

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

  // Server/game integration state
  const [fid, setFid] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string>('');

  // Fetch tries left
  const fetchTriesLeft = async (userFid: number | null) => {
    if (!userFid) return;
    try {
      const res = await fetch('/api/plays-today', { headers: { 'x-fid': String(userFid) } });
      const data = await res.json();
      if (res.ok && typeof data.playsToday === 'number') {
        setTriesLeft(Math.max(0, DAILY_LIMIT - data.playsToday));
      }
    } catch {}
  };

  // Load Farcaster context
  useEffect(() => {
    const loadFarcasterUser = async () => {
      try {
        const context = await sdk.context;
        setFid(context?.user?.fid || null);
        setIsConnected(!!context?.user?.fid);
        fetchTriesLeft(context?.user?.fid || null);
      } catch (e) {
        setFid(null);
        setIsConnected(false);
      }
    };
    loadFarcasterUser();
  }, []);

  // Refetch triesLeft after each round
  useEffect(() => {
    if (fid) fetchTriesLeft(fid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey]);

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
  const playSound = (type: 'click' | 'mine' | 'cash' | 'please') => {
    if (!audioInitializedRef.current) initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(console.error);
  
    const createOsc = (type: OscillatorType, freq: number, duration: number, gain = 0.2) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    };
  
    if (type === 'click') {
      // Wallet coin "ding" – stacked soft triangle tones
      createOsc('triangle', 1046, 0.12); // C6
      setTimeout(() => createOsc('triangle', 1318, 0.12), 80); // E6
    }
  
    if (type === 'mine') {
      // Satisfying stop – drop-down bass thump
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.5, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
  
      // Add a short click for punch
      setTimeout(() => createOsc('square', 80, 0.05, 0.3), 60);
    }
  
    if (type === 'cash') {
      // Winning sound – melodic triangle tones
      createOsc('triangle', 1320, 0.12);
      setTimeout(() => createOsc('triangle', 1650, 0.12), 100);
      setTimeout(() => createOsc('triangle', 1980, 0.1), 200);
    }

    if (type === 'please') {
      // Soft, pleasant "please" sound (gentle sine up-chirp)
      createOsc('sine', 600, 0.10, 0.18);
      setTimeout(() => createOsc('sine', 800, 0.10, 0.14), 60);
      setTimeout(() => createOsc('triangle', 1000, 0.08, 0.12), 120);
    }
  };
  
  
  // Initialize the game
  useEffect(() => {
    // Only start a new round if user is connected
    if (isConnected && fid) {
      startNewRound();
    }
    // Audio listeners, viewport, etc (unchanged)
    const handleUserInteraction = () => { initAudio(); };
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
    const style = document.createElement('style');
    style.innerHTML = `html, body {height: 100%;overflow: hidden;position: fixed;width: 100%;}@supports (-webkit-touch-callout: none) {.safe-height {height: -webkit-fill-available;}}`;
    document.head.appendChild(style);
    const preventScroll = (e: TouchEvent) => {e.preventDefault();};
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      if (audioContextRef.current) audioContextRef.current.close().catch(e => console.error("Failed to close audio context:", e));
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchmove', preventScroll);
      if (meta.parentNode) meta.parentNode.removeChild(meta);
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [isConnected, fid]);

  // Start a new round (server)
  const startNewRound = async () => {
    if (!fid) {
      setMessage("Connect to Farcaster to play!");
      setSupabaseStatus("Not connected to Farcaster");
      return;
    }
    setIsLoadingGame(true);
    setSupabaseStatus("Connecting to Supabase...");
    try {
      const res = await fetch("/api/start-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fid": String(fid),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to start game");
        setSupabaseStatus(data.error || "Supabase error");
        setIsLoadingGame(false);
        return;
      }
      setGameId(data.gameId);
      // Initialize grid based on backend response
      const size = data.gridSize || 25;
      const newGrid = Array(size).fill(null).map((_, index) => ({
        id: index,
        isMine: false, // Don't reveal mines at start
        isRevealed: (data.revealedPositions || []).includes(index),
        isAnimating: false
      }));
      setGrid(newGrid);
      setRevealedPositions(data.revealedPositions || []);
      setMinePositions([]); // Hide mines until game over
      setGameOver(false);
      setGameWon(false);
      setPotentialWinnings(0);
      setCanCashOut(false);
      setMessage("Click on tiles to reveal them!");
      setClickedMineIndex(null);
      setGameKey(prevKey => prevKey + 1);
      setSupabaseStatus("Connected to Supabase!");
    } catch (e) {
      setMessage("Could not connect to server.");
      setSupabaseStatus("Could not connect to Supabase");
    } finally {
      setIsLoadingGame(false);
    }
  };

  
  // Calculate payout based on revealed safe tiles
  const calculatePayout = (revealedCount: number): number => {
    if (revealedCount === 0) return 0;
    
    // Simple exponential payout formula
    // The more safe tiles revealed, the higher the multiplier
    const multiplier = 1 + (revealedCount * 0.2);
    return Math.floor(WAGER_AMOUNT * multiplier);
  };
  
  // Handle tile click (server)
  const handleTileClick = async (index: number) => {
    initAudio();
    if (!fid || !gameId) return;
    if (
      gameOver ||
      revealedPositions.includes(index) ||
      processingTilesRef.current.has(index) ||
      clickedMineIndex !== null
    ) return;
    // Immediate animation feedback
    setGrid(prevGrid => prevGrid.map((tile, idx) =>
      idx === index ? { ...tile, isAnimating: true } : tile
    ));
    processingTilesRef.current.add(index);
    setMessage("Revealing...");
    try {
      const res = await fetch("/api/reveal-cell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fid": String(fid),
        },
        body: JSON.stringify({ gameId, cellIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to reveal cell");
        processingTilesRef.current.delete(index);
        return;
      }
      setRevealedPositions(data.revealed);
      setGameOver(data.gameOver);
      setGameWon(data.won);
      // Remove animation state and update revealed/mine
      setGrid(prevGrid => prevGrid.map((tile, idx) => {
        if (idx === index) {
          return {
            ...tile,
            isAnimating: false,
            isRevealed: true,
            isMine: data.isMine ? true : tile.isMine
          };
        }
        // If game over and mines need to be revealed
        if (data.isMine && data.minePositions && data.minePositions.includes(idx)) {
          return { ...tile, isMine: true, isRevealed: true, isAnimating: false };
        }
        return tile;
      }));
      // Update winnings after each safe reveal
      if (!data.isMine && !data.gameOver) {
        const safeTiles = data.revealed.length;
        const winnings = safeTiles > 0 ? WAGER_AMOUNT * Math.pow(2, safeTiles - 1) : 0;
        setPotentialWinnings(winnings);
      }
      if (data.isMine) {
        setClickedMineIndex(index);
        setMessage("Boom! You hit a mine.");
        playSound('mine');
        // Reveal all mines
        if (data.minePositions) {
          setMinePositions(data.minePositions);
        }
      } else {
        setMessage("Safe! Keep going.");
        playSound('click');
      }
      processingTilesRef.current.delete(index);
    } catch (e) {
      setMessage("Could not connect to server.");
      setSupabaseStatus("Could not connect to Supabase");
      processingTilesRef.current.delete(index);
    }
  };

  
  // Handle cash out (server)
  const handleCashOut = async () => {
    if (!fid || !gameId || !canCashOut || gameOver) return;
    initAudio();
    setMessage("Cashing out...");
    try {
      const res = await fetch("/api/cash-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fid": String(fid),
        },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to cash out");
        setSupabaseStatus(data.error || "Supabase error");
        return;
      }
      setGameOver(true);
      setGameWon(true);
      setMinePositions(data.minePositions);
      setRevealedPositions(data.revealed);
      setModalIsWin(true);
      setModalWinAmount(potentialWinnings); // Or data.winAmount if you add it to API
      setModalOpen(true);
      setMessage("You cashed out!");
      playSound('cash');
    } catch (e) {
      setMessage("Could not connect to server.");
      setSupabaseStatus("Could not connect to Supabase");
    }
  };

  
  // Modal button handlers
  const handleShareResult = () => {
    // Close modal and start new round
    setModalOpen(false);
    startNewRound();
  };

  const handleTryAgain = () => {
    playSound('please');
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
  // Handle Collect (local, not server cash out)
const handleCollect = () => {
  if (gameOver || revealedPositions.length === 0) return;
  setGameOver(true);
  setGameWon(true);
  setModalIsWin(true);
  setModalWinAmount(potentialWinnings);
  setModalOpen(true);
  setMessage("You collected your winnings!");
  playSound('cash');
};
  const handleButton3Click = () => console.log('Button 3 clicked');
  const handleButton4Click = () => console.log('Button 4 clicked');

  return (
    <div className="flex flex-col h-full w-full text-white  inset-0 safe-height">
      {/* Supabase/Farcaster connection status */}
      {/* <div className="text-xs text-neutral-400 px-4 pt-2">
        {isConnected ? `Farcaster FID: ${fid}` : "Not connected"}
        {gameId && <span> | Game ID: {gameId}</span>}
        {supabaseStatus && <span> | {supabaseStatus}</span>}
      </div> */}
      {/* Main container with fixed proportions */}
      <div className="flex flex-col h-[calc(100%-60px)] justify-between">
        {/* Top section - using relative size for mobile */}
        <div className=" flex items-center h-full justify-center py-4">
          <h1 className="text-2xl font-mono text-center">find some gems</h1>
        </div>
        
        {/* Grid section - centered with dynamic sizing */}
        <div className="flex items-center justify-center px-4 py-2 flex-grow ">
          <div key={gameKey} className="grid grid-cols-5 gap-2 w-full max-w-[90vw] aspect-square">
            {grid.map((tile, index) => {
              // Determine if this tile is:
              // 1. The clicked mine
              const isClickedMine = tile.isMine && index === clickedMineIndex && gameOver;
              // 2. Another mine that should be shown at reduced opacity when game is over
              const isOtherMine = tile.isMine && gameOver && index !== clickedMineIndex;
              // 3. A safe tile that was clicked before game over
              const isSafeTileRevealed = revealedPositions.includes(index) && !tile.isMine;
              // 4. A regular unrevealed tile
              const isUnrevealed = !isClickedMine && !isOtherMine && !isSafeTileRevealed;
              // Set opacity for different scenarios
              let opacity = 1; // Default full opacity
              if (gameOver) {
                if (isClickedMine || isSafeTileRevealed) {
                  opacity = 1;
                } else {
                  // Reduced opacity for other mines and unrevealed tiles
                  opacity = 0.5;
                }
              }
              return (
                <motion.button
  key={`${gameKey}-${index}`}
  onClick={() => handleTileClick(index)}
  className="aspect-square w-full h-full flex items-center justify-center font-bold relative"
  style={{
    touchAction: 'none',
    opacity,
    padding: 0,
    border: 'none',
    backgroundColor:
      isSafeTileRevealed || isClickedMine || isOtherMine
        ? 'transparent'
        : tile.isAnimating
        ? '#4b5563' // lighter during press (gray-600)
        : '#374151', // default (gray-700)
    borderRadius:
      isSafeTileRevealed ? '9999px' : '0.5rem',
    boxShadow:
      !isSafeTileRevealed && !isClickedMine && !isOtherMine
        ? 'inset 0 -4px 0 rgba(0,0,0,0.3)'
        : undefined,
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
        backgroundImage: 'url(/tokens/higher.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )}

  {/* MINE REVEAL — stays square */}
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
        backgroundColor: '#b91c1c', // red-700
        color: 'white',
      }}
    >
      💣
    </motion.div>
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
            {revealedPositions.length > 0 && !gameOver ? (
              <motion.button
                className="bg-green-700 hover:bg-green-600 py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
                onClick={handleCollect}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Collect ({potentialWinnings} credits)
              </motion.button>
            ) : gameOver ? (
              <motion.button
                className="bg-purple-700 hover:bg-purple-600 text-white py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
                onClick={() => { playSound('please'); startNewRound(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again ({triesLeft} tries left)
              </motion.button>
            ) : (
              <button
                className="bg-transparent py-6 px-6 rounded-lg font-bold w-full mx-auto flex flex-col items-center justify-center cursor-not-allowed text-center"
                style={{ height: '72px' }}
                disabled
              ><div className="animate-pulse">
                <svg height="32" viewBox="0 0 40 40" fill="currentColor" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6l-12 14h7v10h10V20h7L20 6z" />
                </svg></div>
              </button>
            )}
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