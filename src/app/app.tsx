// src/app/page.tsx
'use client';
import React, { useState } from 'react';
import MinesGame from '../components/grid';
import Nav from '../components/Nav';
import LeaderboardModal from '../components/LeaderboardModal';
import PrizesModal from '../components/PrizesModal';
import ActivityFeed from '../components/ActivityFeed';

export default function Home() {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [prizesOpen, setPrizesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  // Handlers to ensure only one modal is open at a time
  const handleOpenLeaderboard = () => {
    setPrizesOpen(false);
    setActivityOpen(false);
    setLeaderboardOpen(true);
  };
  const handleOpenPrizes = () => {
    setLeaderboardOpen(false);
    setActivityOpen(false);
    setPrizesOpen(true);
  };
  const handleOpenActivity = () => {
    setLeaderboardOpen(false);
    setPrizesOpen(false);
    setActivityOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full text-white pb-24">
      <MinesGame />
      {/* Modals should be rendered after main content, before nav, so they overlay nav */}
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <PrizesModal isOpen={prizesOpen} onClose={() => setPrizesOpen(false)} />
      {activityOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80" onClick={() => setActivityOpen(false)}>
          <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 relative flex flex-col h-[80vh] min-h-[400px] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActivityOpen(false)}
              className="absolute top-1.5 right-1.5 text-white text-lg font-bold p-1 hover:bg-neutral-800 rounded"
              aria-label="Close"
            >
              ×
            </button>
            <h1 className="text-2xl text-center mb-4">Activity</h1>
            <div className="flex-1 min-h-0 overflow-y-auto w-full modal-scroll">
              <ActivityFeed />
            </div>
          </div>
        </div>
      )}
      {/* Nav is always under the modal, so it stays beneath */}
      <Nav
        active={leaderboardOpen ? 'leaderboard' : prizesOpen ? 'prizes' : activityOpen ? 'activity' : 'home'}
        onOpenLeaderboard={handleOpenLeaderboard}
        onOpenPrizes={handleOpenPrizes}
        onOpenActivity={handleOpenActivity}
      />
    </div>
  );
}