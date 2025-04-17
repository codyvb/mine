import React from 'react';

import Link from 'next/link';

interface NavProps {
  active?: 'home' | 'leaderboard' | 'prizes';
  onOpenLeaderboard?: () => void;
  onOpenPrizes?: () => void;
}

const Nav: React.FC<NavProps> = ({ active, onOpenLeaderboard, onOpenPrizes }) => (
  <div className="fixed pb-10 bottom-0 left-0 w-full z-50 flex flex-row gap-4 px-5 py-4 justify-center">
    <button
      className={`flex-1 px-4 py-4 bg-neutral-700 hover:bg-neutral-800 text-white rounded-md transition-colors text-sm ${active === 'leaderboard' ? 'bg-neutral-800' : ''}`}
      onClick={onOpenLeaderboard}
      type="button"
    >
      Leaderboard
    </button>
    <button
      className={`flex-1 px-4 py-4 bg-neutral-700 hover:bg-neutral-800 text-white rounded-md transition-colors text-sm ${active === 'prizes' ? 'bg-neutral-800' : ''}`}
      onClick={onOpenPrizes}
      type="button"
    >
      Gems
    </button>
  </div>
);


export default Nav;
