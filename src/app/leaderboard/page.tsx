

"use client";

import React from 'react';

import ActivityFeed from "../../components/ActivityFeed";

const LeaderboardPage: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-black text-white safe-height">
      <h1 className="text-2xl font-mono text-center mb-4">Leaderboard</h1>
      {/* Leaderboard content goes here */}
      <ActivityFeed />
    </div>
  );
};

export default LeaderboardPage;
