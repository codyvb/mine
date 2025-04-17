// src/app/page.tsx
'use client';
import React, { useState } from 'react';
import MinesGame from '../components/grid';
import Nav from '../components/Nav';
import LeaderboardModal from '../components/LeaderboardModal';
import PrizesModal from '../components/PrizesModal';

export default function Home() {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [prizesOpen, setPrizesOpen] = useState(false);

  // Handlers to ensure only one modal is open at a time
  const handleOpenLeaderboard = () => {
    setPrizesOpen(false);
    setLeaderboardOpen(true);
  };
  const handleOpenPrizes = () => {
    setLeaderboardOpen(false);
    setPrizesOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full text-white pb-24">
      <MinesGame />
      {/* Modals should be rendered after main content, before nav, so they overlay nav */}
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <PrizesModal isOpen={prizesOpen} onClose={() => setPrizesOpen(false)} />
      {/* Nav is always under the modal, so it stays beneath */}
      <Nav
        active="home"
        onOpenLeaderboard={handleOpenLeaderboard}
        onOpenPrizes={handleOpenPrizes}
      />
    </div>
  );
}