'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTries } from './TriesContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import GameModal from './GameModal';
import CountdownToReset from './CountdownToReset';
import sdk from '@farcaster/frame-sdk';
import TokenToast from './TokenToast';

// Define types for our game
interface Tile {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isAnimating: boolean;
}

const MinesGame: React.FC = () => {
  // Track if the congrats modal was ever closed by the user
  // Tracks if the congrats modal was closed by the user (never reopens for this round)
  const [modalManuallyClosed, setModalManuallyClosed] = useState(false);
  const router = useRouter();
  const { tries, setTries, fetchTries, nextReset } = useTries();

  // UI loading state
  const [isUILoading, setIsUILoading] = useState(true);

  // Keep track of tiles currently being processed to prevent race conditions
  const processingTilesRef = useRef<Set<number>>(new Set());
  // Game constants
  const GRID_SIZE = 5;
  const MINE_COUNT = 3;
  const ANIMATION_DURATION = 400;

  const [grid, setGrid] = useState<Tile[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [mineHit, setMineHit] = useState(false);
  // --- REMOVE potentialWinnings state ---
// const [potentialWinnings, setPotentialWinnings] = useState(0); // now tracks gems revealed
// Instead, always derive the count below:
const safeRevealedCount = revealedPositions.filter(idx => grid[idx] && !grid[idx].isMine).length;
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
  // Fetch tries from context
  const fetchTriesLeft = fetchTries;

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
      } finally {
        setIsUILoading(false); // Mark UI as loaded after async/game state is ready
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
  // type 'sent' is for transaction confirmation (bright, rising arpeggio)
const playSound = (type: 'press' | 'click' | 'mine' | 'cash' | 'please' | 'sent') => {
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
  
    if (type === 'press') {
      // Quick, suspenseful click (short, sharp, lower-pitch)
      createOsc('square', 340, 0.07, 0.18);
      setTimeout(() => createOsc('triangle', 500, 0.05, 0.12), 35);
    }
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

    if (type === 'sent') {
      // Satisfying, definitive send/confirmation sound (not a laser)
      const ctxNow = ctx.currentTime;
      // 1. Percussive 'thunk' (low sine)
      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(210, ctxNow);
      osc1.frequency.linearRampToValueAtTime(110, ctxNow + 0.11);
      g1.gain.setValueAtTime(0.32, ctxNow);
      g1.gain.linearRampToValueAtTime(0.01, ctxNow + 0.13);
      osc1.connect(g1).connect(ctx.destination);
      osc1.start(ctxNow);
      osc1.stop(ctxNow + 0.13);
      // 2. Crisp snap (noise burst)
      const bufferSize = ctx.sampleRate * 0.025;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16, ctxNow);
      // Highpass filter for snap
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(900, ctxNow);
      noise.connect(filter).connect(noiseGain).connect(ctx.destination);
      noise.start(ctxNow + 0.01);
      noise.stop(ctxNow + 0.045);
      // 3. Subtle rising chime (triangle up-chirp, short)
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(600, ctxNow + 0.03);
      osc2.frequency.linearRampToValueAtTime(950, ctxNow + 0.12);
      g2.gain.setValueAtTime(0.12, ctxNow + 0.03);
      g2.gain.linearRampToValueAtTime(0.01, ctxNow + 0.14);
      osc2.connect(g2).connect(ctx.destination);
      osc2.start(ctxNow + 0.03);
      osc2.stop(ctxNow + 0.14);
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
    setMineHit(false);
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
      // setPotentialWinnings(0); // removed, always derived.
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

  
  // No payout math needed for free-to-play gems game.
  
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
        // --- Merge revealed positions optimistically ---
        setRevealedPositions(prev => Array.from(new Set([...prev, ...data.revealed])));
        setGameOver(data.gameOver);
        setGameWon(data.won);
        setGrid(prevGrid => prevGrid.map((tile, idx) => {
          // Always keep revealed if it was revealed locally or by server
          const revealed = tile.isRevealed || data.revealed.includes(idx);
          if (idx === index) {
            return {
              ...tile,
              isAnimating: false,
              isRevealed: revealed,
              isMine: data.isMine ? true : tile.isMine
            };
          }
          // If game over and mines need to be revealed
          if (data.isMine && data.minePositions && data.minePositions.includes(idx)) {
            return { ...tile, isMine: true, isRevealed: true, isAnimating: false };
          }
          return {
            ...tile,
            isRevealed: revealed
          };
        }));
        // Update gems after each safe reveal
        if (!data.isMine && !data.gameOver) {
          // setPotentialWinnings removed; always use derived safeRevealedCount.
        }
        if (data.isMine) {
          setGameOver(true);
          setGameWon(false);
          setMineHit(true);
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
      setModalWinAmount(safeRevealedCount); // now gem count
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
    // modalManuallyClosed will reset via useEffect on gameKey change
    // The modal will only open again if the user explicitly collects in the new round
  };

  const handleTryAgain = () => {
  setMineHit(false);
    playSound('please');
    setModalOpen(false);
    setTries(t => Math.max(0, (t ?? 0) - 1)); // Optimistically decrement
    startNewRound();
    // modalManuallyClosed will reset via useEffect on gameKey change
    // The modal will only open again if the user explicitly collects in the new round
  };

  // Handle modal close (X button)
  const handleModalClose = () => {
    setModalManuallyClosed(true);
    setModalOpen(false);
    setMineHit(false);
    startNewRound();
  };

  // Ensure modalEverClosed resets on new round
  useEffect(() => {
    setModalManuallyClosed(false);
  }, [gameKey]);

  // Dummy functions for the bottom buttons
  
  // Handle Collect (secure, server verified)
  const [tokenToast, setTokenToast] = useState<{ loading: boolean; hash?: string; amount?: number; to?: string; error?: string | null } | null>(null);
  // Store the server-verified amount for the toast
  const [verifiedTokenAmount, setVerifiedTokenAmount] = useState<number | null>(null);
  const handleCollect = async () => {
  // Allow collect if player hasn't lost and has revealed at least one tile
  if (gameOver && !gameWon) return;
  if (mineHit) return;
  if (revealedPositions.length === 0 || !fid || !gameId) return;
    // Open congrats modal immediately, but only ONCE per round
    if (!modalOpen && !modalManuallyClosed) {
      setGameOver(true);
      setGameWon(true);
      setModalIsWin(true);
      setModalWinAmount(safeRevealedCount);
      setModalOpen(true);
    } else {
      setGameOver(true);
      setGameWon(true);
      setModalIsWin(true);
      setModalWinAmount(safeRevealedCount);
    }
    playSound('cash'); // Play success sound immediately when user collects
    setTokenToast({ loading: true });
    try {
      // 1. Call /api/cash-out to finalize the game and get verified winnings
      const cashRes = await fetch("/api/cash-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fid": String(fid),
        },
        body: JSON.stringify({ gameId }),
      });
      const cashData = await cashRes.json();
      if (!cashRes.ok) {
        setTokenToast({ loading: false, error: cashData.error || "Failed to cash out" });
        return;
      }
      // Server will have validated and ended the game, and we can trust the revealed count
      const verifiedAmount = cashData.revealed?.length || 0;
      setVerifiedTokenAmount(verifiedAmount); // <-- Save for use in toast
      // 2. Call /api/send-token with only the FID; backend will securely determine the amount
      const sendRes = await fetch("/api/send-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fid": String(fid),
        },
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        setTokenToast({ loading: false, error: sendData.error || "Failed to send token" });
        return;
      }
      // Show the toast with tx info (address, amount, hash)
      setTokenToast({
        loading: false,
        hash: sendData.hash,
        amount: sendData.amount || verifiedAmount,
        to: sendData.to || '', // backend should return recipient address if possible
        error: null,
      });
      playSound('sent'); // Play transaction confirmation sound
      // DO NOT update game state here! Only the toast and sound.
      // All game state is set at collect/cash-out time above.
      // NO setGameOver, setGameWon, setModalIsWin, setModalWinAmount, setModalOpen, or setMessage here!
      // playSound('cash') REMOVED from here
    } catch (e: any) {
      setTokenToast({ loading: false, error: e.message || "Unknown error" });
    }
  };

  if (isUILoading) {
    // Show pulsing grid skeleton while loading
    return (
      <div className="flex flex-col h-full w-full justify-center items-center">
        <div className="flex items-center justify-center px-4 py-2 flex-grow">
          <div className="grid grid-cols-5 gap-2 w-full max-w-[90vw] aspect-square">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="aspect-square w-full h-full bg-neutral-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If out of tries, show countdown instead of grid/buttons
  if (tries === 0) {
    return (
      <div className="flex flex-col h-full w-full justify-center items-center">
        <CountdownToReset nextReset={nextReset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full text-white justify-center  inset-0 safe-height">
      {/* Main container with fixed proportions */}
      <div className="flex flex-col h-[calc(100%-60px)] justify-between">
        {/* Top section - using relative size for mobile */}
        <div className=" flex items-center h-full justify-center py-2">
          <h1 className="text-2xl text-center">Find some gems</h1>
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
  onClick={() => {
    playSound('press');
    handleTileClick(index);
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
        ? '#4b5563' // lighter during press (gray-600)
        : '#374151', // default (gray-700)
    borderRadius:
      isSafeTileRevealed ? '9999px' : '0.5rem',
    boxShadow:
      (!isSafeTileRevealed && !isClickedMine && !isOtherMine)
        ? 'inset 0 -4px 0 rgba(0,0,0,0.3)'
        : undefined,
  }}
  // Idle tease animation props removed
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
            {mineHit ? (
  <motion.button
    className="bg-purple-700 hover:bg-purple-600 text-white py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
    onClick={() => { playSound('please'); startNewRound(); }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    Try Again ({tries} tries left)
  </motion.button>
) : (
  revealedPositions.length > 0 ? (
    <motion.button
      className="bg-green-700 hover:bg-green-600 py-6 px-6 rounded-lg font-bold transition-colors w-full mx-auto block text-center"
      onClick={handleCollect}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Collect {safeRevealedCount} Gem{safeRevealedCount === 1 ? '' : 's'}
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
  )
)}
          </div>
          
        </div>
      </div>
      
      {/* Toast for token send */}
      {tokenToast && (
        <TokenToast
          loading={tokenToast.loading}
          hash={tokenToast.hash || ''}
          // Show correct token count in loading state
          amount={
            tokenToast.loading
              ? (verifiedTokenAmount?.toString() || '')
              : (tokenToast.amount?.toString() || verifiedTokenAmount?.toString() || '')
          }
          to={tokenToast.to || ''}
          error={tokenToast.error}
          onClose={() => setTokenToast(null)}
        />
      )}
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