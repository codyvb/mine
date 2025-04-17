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

  return (
    <div className="flex flex-col flex-1 h-full w-full text-white pb-24">
      <MinesGame />
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <PrizesModal isOpen={prizesOpen} onClose={() => setPrizesOpen(false)} />
      <Nav
        active="home"
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenPrizes={() => setPrizesOpen(true)}
      />
    </div>
  );
}