'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTries } from './TriesContext';

import GameModal from './GameModal';
import CountdownToReset from './CountdownToReset';
import sdk from '@farcaster/frame-sdk';
import TokenToast from './TokenToast';
import TileGrid from './TileGrid';

// Define types for our game
export interface Tile {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isAnimating: boolean;
}

const MinesGame: React.FC = () => {
  // ...existing state
  const [pendingRevealIndex, setPendingRevealIndex] = useState<number | null>(null);
  const [isStartingNewRound, setIsStartingNewRound] = useState(false);
  // Track if the congrats modal was ever closed by the user
  // Tracks if the congrats modal was closed by the user (never reopens for this round)
  const [modalManuallyClosed, setModalManuallyClosed] = useState(false);

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
  const [confirmedRevealedPositions, setConfirmedRevealedPositions] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const [gameWon, setGameWon] = useState(false);
  const [mineHit, setMineHit] = useState(false);
  
  // Always derive the count from backend-confirmed positions
  const safeRevealedCount = confirmedRevealedPositions.filter((idx: number) => grid[idx] && !grid[idx].isMine).length;
  
  const [canCashOut, setCanCashOut] = useState(false);
  const [message, setMessage] = useState('Click on tiles to reveal them!');
  const [gameKey, setGameKey] = useState(0);

  // Server/game integration state
  const [fid, setFid] = useState<number | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  

  // Fetch tries left
  // Fetch tries from context
  const { tries, setTries, fetchTries, nextReset } = useTries();
const fetchTriesLeft = fetchTries;

  // Load Farcaster context and fetch tries only after FID is set
  useEffect(() => {
    let cancelled = false;
    const loadFarcasterUser = async () => {
      try {
        const context = await sdk.context;
        const fetchedFid = context?.user?.fid || null;
        setFid(fetchedFid);
        if (fetchedFid && !cancelled) {
          await fetchTriesLeft(fetchedFid);
        }
      } catch (e) {
        setFid(null);
      } finally {
        if (!cancelled) setIsUILoading(false);
      }
    };
    loadFarcasterUser();
    return () => { cancelled = true; };
  }, []);

  // Refetch triesLeft after each round if FID changes or gameKey changes
  useEffect(() => {
    if (fid) fetchTriesLeft(fid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid, gameKey]);

  // If FID becomes available after initial mount, fetch tries
  useEffect(() => {
    if (fid && tries === null && !isUILoading) {
      fetchTriesLeft(fid);
    }
  }, [fid, isUILoading]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  
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
    if (gameOverRef.current && (type === 'press' || type === 'click')) return;
    
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
    if (fid) {
      startNewRound();
    }
    
    // Audio listeners, viewport, etc
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
  }, [fid]);

  // Start a new round (server)
  const startNewRound = async () => {
    gameOverRef.current = false;
    processingTilesRef.current = new Set();
    setMineHit(false);

    if (!fid) {
      setMessage("Connect to Farcaster to play!");
      return;
    }
    
    setIsLoadingGame(true);
    
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
      setConfirmedRevealedPositions(data.revealedPositions || []);
      setMinePositions([]); // Hide mines until game over
      setGameOver(false);
      setGameWon(false);
      setCanCashOut(false);
      setMessage("Click on tiles to reveal them!");
      setGameKey(prevKey => prevKey + 1);
    } catch (e) {
      setMessage("Could not connect to server.");
    } finally {
      setIsLoadingGame(false);
    }
  };
  
  // Handle tile click (server)
  const handleTileClick = async (index: number) => {
    // Prevent multiple reveals at once
    if (pendingRevealIndex !== null) return;
    // ABSOLUTELY NO SOUND if game is over (sync ref)
    if (gameOverRef.current) {
      processingTilesRef.current.delete(index);
      return;
    }
    if (confirmedRevealedPositions.includes(index) || processingTilesRef.current.has(index)) return;
    setPendingRevealIndex(index);
    initAudio();
    // Optimistically reveal the tile and animate
    setGrid(prevGrid => prevGrid.map((tile, idx) =>
      idx === index ? { ...tile, isAnimating: true, isRevealed: true } : tile
    ));
    // Only add to processingTilesRef AFTER all checks
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
      
      // Defensively ensure the just-clicked tile is included in revealed positions
      const backendRevealed = data.revealed || [];
      const allRevealed = backendRevealed.includes(index)
        ? backendRevealed
        : [...backendRevealed, index];
      setConfirmedRevealedPositions(allRevealed);
      setGameOver(data.gameOver);
      setGameWon(data.won);
      
      setGrid(prevGrid => prevGrid.map((tile, idx) => {
        // If this is the just-clicked tile and NOT a mine, always keep it revealed
        if (idx === index && !data.isMine) {
          return {
            ...tile,
            isAnimating: false,
            isRevealed: true,
            isMine: tile.isMine
          };
        }
        // If this is the just-clicked tile and IS a mine, reveal as mine
        if (idx === index && data.isMine) {
          return {
            ...tile,
            isAnimating: false,
            isRevealed: true,
            isMine: true
          };
        }
        // For all other tiles, use the merged revealed list
        const revealed = tile.isRevealed || allRevealed.includes(idx);
        if (data.isMine && data.minePositions && data.minePositions.includes(idx)) {
          return { ...tile, isMine: true, isRevealed: true, isAnimating: false };
        }
        return {
          ...tile,
          isRevealed: revealed
        };
      }));
      setPendingRevealIndex(null);
      
      if (data.isMine) {
        gameOverRef.current = true;
        setGameOver(true);
        setGameWon(false);
        setMineHit(true);
        setMessage("Boom! You hit a mine.");
        playSound('mine');
        
        if (data.minePositions) {
          setMinePositions(data.minePositions);
        }
        
        // Reveal all tiles at end state (mine hit)
        setGrid(prevGrid => prevGrid.map(tile => ({ ...tile, isRevealed: true, isAnimating: false })));
        return;
      } else {
        setMessage("Safe! Keep going.");
        playSound('click');
      }
      
      processingTilesRef.current.delete(index);
    } catch (e) {
      setMessage("Could not connect to server.");
      setPendingRevealIndex(null);
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
        return;
      }
      
      setGameOver(true);
      setGameWon(true);
      setMinePositions(data.minePositions);
      setMessage("You cashed out!");
      playSound('cash');
    } catch (e) {
      setMessage("Could not connect to server.");
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

  const handleTryAgain = async () => {
    setIsStartingNewRound(true); // Hide footer buttons immediately
    gameOverRef.current = false;
    processingTilesRef.current = new Set();
    setMineHit(false);
    setGameOver(false);
    setGameWon(false);
    setCanCashOut(false);
    setMessage("");
    setModalOpen(false);
    setTries((t: number | null) => Math.max(0, (t ?? 0) - 1)); // Optimistically decrement
    setGameKey(prevKey => prevKey + 1); // If you use this for remounting TileGrid
    playSound('please');
    await startNewRound(); // If this is async, await it
    setIsStartingNewRound(false); // Show buttons again when new round is ready
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
  
  // Handle Collect (secure, server verified)
  const [tokenToast, setTokenToast] = useState<{ 
    loading: boolean; 
    hash?: string; 
    amount?: number; 
    to?: string; 
    error?: string | null 
  } | null>(null);
  
  // Store the server-verified amount for the toast
  const [verifiedTokenAmount, setVerifiedTokenAmount] = useState<number | null>(null);
  
  const handleCollect = async () => {
    // Allow collect if player hasn't lost and has revealed at least one tile
    if (gameOver && !gameWon) return;
    if (mineHit) return;
    if (confirmedRevealedPositions.length === 0 || !fid || !gameId) return;
    
    // Open congrats modal immediately, but only ONCE per round
    if (!modalOpen && !modalManuallyClosed) {
      setGameOver(true);
      setGameWon(true);
      setModalOpen(true);
    } else {
      setGameOver(true);
      setGameWon(true);
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
      setVerifiedTokenAmount(verifiedAmount); // Save for use in toast
      // Reveal all tiles at end state (cash out)
      setGrid(prevGrid => prevGrid.map(tile => ({ ...tile, isRevealed: true, isAnimating: false })));
      
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
      // All game state is set at collect/cash-out time above
    } catch (e: any) {
      // Handle error if needed
    }
  } // <-- This closes handleCollect

  // Main render
  
  let mainContent: React.ReactNode;
  if (isUILoading) {
    mainContent = (
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
  } else if (fid === null) {
    mainContent = (
      <div className="flex flex-col h-full w-full justify-center items-center">
        <div className="text-center text-lg text-neutral-300">Unable to fetch Farcaster user. Please refresh or try again.</div>
      </div>
    );
  } else if (tries === null) {
    mainContent = (
      <div className="flex flex-col h-full w-full justify-center items-center">
        <div className="text-center text-lg text-neutral-300">Loading your available tries...</div>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => fid && fetchTriesLeft(fid)}
        >Retry</button>
      </div>
    );
  } else if (tries === 0) {
    mainContent = (
      <div className="flex flex-col h-full w-full justify-center items-center">
        <CountdownToReset nextReset={nextReset} />
      </div>
    );
  } else {
    mainContent = (
      <div className="flex flex-col h-full w-full text-white justify-center inset-0 safe-height">
        <div className="flex flex-col h-[calc(100%-60px)] justify-between">
          <TileGrid
            grid={grid}
            revealedPositions={confirmedRevealedPositions}
            minePositions={minePositions}
            gameOver={gameOver}
            safeRevealedCount={safeRevealedCount}
            playSound={playSound}
            handleTileClick={handleTileClick}
            gameKey={gameKey}
            mineHit={mineHit}
            tries={tries ?? 0}
            handleCollect={handleCollect}
            handleTryAgain={handleTryAgain}
            isStartingNewRound={isStartingNewRound}
            pendingRevealIndex={pendingRevealIndex}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {mainContent}
      {tokenToast && (
        <TokenToast
          loading={tokenToast.loading}
          hash={tokenToast.hash || ''}
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
      <GameModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onTryAgain={handleTryAgain}
        grid={grid}
        revealedPositions={confirmedRevealedPositions}
        isWin={gameWon}
        winAmount={confirmedRevealedPositions.filter((idx: number) => grid[idx] && !grid[idx].isMine).length}
      />
    </>
  );
};

export default MinesGame;