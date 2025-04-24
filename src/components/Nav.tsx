import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useFarcaster } from './FarcasterContext';
import UserProfileModal from './UserProfileModal';
import sdk from '@farcaster/frame-sdk';

import Link from 'next/link';

interface NavProps {
  active?: 'home' | 'leaderboard' | 'prizes';
  onOpenLeaderboard?: () => void;
  onOpenPrizes?: () => void;
}

const Nav: React.FC<NavProps> = ({ active, onOpenLeaderboard, onOpenPrizes }) => {
  const { pfpUrl, displayName, username, fid, isConnected } = useFarcaster();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleAvatarClick = () => {
    if (isConnected) setShowProfileModal(true);
  };

  const handleViewProfile = () => {
    if (fid) {
      sdk.actions.viewProfile({ fid });
      setShowProfileModal(false);
    }
  };

  return (
    <>
      <div className="fixed pb-10 bottom-0 left-0 w-full z-50 flex flex-row gap-4 px-5 py-4 justify-center items-center">
        <button
          className={`flex-1 px-4 py-4 bg-neutral-700 hover:bg-neutral-800 text-white rounded-md transition-colors text-sm ${active === 'leaderboard' ? 'bg-neutral-800' : ''}`}
          onClick={onOpenLeaderboard}
          type="button"
        >
          Activity
        </button>
        <button
          className={`flex-1 px-4 py-4 bg-neutral-700 hover:bg-neutral-800 text-white rounded-md transition-colors text-sm ${active === 'prizes' ? 'bg-neutral-800' : ''}`}
          onClick={onOpenPrizes}
          type="button"
        >
          Gems
        </button>
        {/* User avatar */}
        <div className="flex items-center justify-center">
          {pfpUrl ? (
            <img
              src={pfpUrl}
              alt={displayName || username || 'User avatar'}
              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-600 bg-neutral-700 ml-3 cursor-pointer"
              onClick={handleAvatarClick}
            />
          ) : (
            <div
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-700 border-2 border-neutral-600 ml-3 cursor-pointer"
              onClick={handleAvatarClick}
            >
              <User size={24} className="text-neutral-400" />
            </div>
          )}
        </div>
      </div>
      {/* User Profile Modal */}
      <UserProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        pfpUrl={pfpUrl}
        displayName={displayName}
        username={username}
        fid={fid}
        handleViewProfile={handleViewProfile}
      />
    </>
  );
};

export default Nav;
