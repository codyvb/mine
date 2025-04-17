import React from 'react';

import Link from 'next/link';

interface NavProps {
  active?: 'home' | 'leaderboard' | 'prizes';
}

const Nav: React.FC<NavProps> = ({ active }) => (
  <div className="flex flex-row gap-2 w-full  pb-10 mt-2 justify-center overflow-x-auto">
    <Link href="/" passHref legacyBehavior>
      <a
        className={`bg-neutral-600 w-full hover:bg-neutral-700 py-4 rounded-lg transition-colors text-sm block text-center${active === 'home' ? ' font-bold' : ''}`}
      >
        home
      </a>
    </Link>
    <Link href="/leaderboard" passHref legacyBehavior>
      <a
        className={`bg-neutral-600 w-full hover:bg-neutral-700 py-4 rounded-lg transition-colors text-sm block text-center${active === 'leaderboard' ? ' font-bold' : ''}`}
      >
        leaderboard
      </a>
    </Link>
    <Link href="/prizes" passHref legacyBehavior>
      <a
        className={`bg-neutral-600 w-full hover:bg-neutral-700 py-4 rounded-lg transition-colors text-sm block text-center${active === 'prizes' ? ' font-bold' : ''}`}
      >
        prizes
      </a>
    </Link>
  </div>
);


export default Nav;
