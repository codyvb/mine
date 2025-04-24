import React from 'react';
import { User, X, ExternalLink } from 'lucide-react';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  pfpUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  fid?: number | null;
  handleViewProfile?: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onClose,
  pfpUrl,
  displayName,
  username,
  fid,
  handleViewProfile,
}) => {
  if (!open) return null;
  const userDisplayName = displayName || username || (fid ? String(fid) : '');
  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-lg shadow-lg max-w-md w-full p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>
        <div className="flex items-center space-x-4 mb-4">
          {pfpUrl ? (
            <img
              src={pfpUrl}
              alt={`${userDisplayName}'s avatar`}
              className="w-16 h-16 rounded-full object-cover border-2 border-neutral-600"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-500 text-white">
              <User size={30} />
            </div>
          )}
          <div>
            <h3 className="text-white font-bold text-xl">
              {displayName || `@${username}`}
            </h3>
            <p className="text-neutral-400">
              {username ? `@${username}` : fid ? `FID: ${fid}` : ''}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-neutral-700 rounded p-3">
            <p className="text-neutral-400 text-sm">FID</p>
            <p className="text-white font-bold">{fid}</p>
          </div>
          <div className="bg-neutral-700 rounded p-3">
            <p className="text-neutral-400 text-sm">Connected</p>
            <p className="text-white font-bold">✓</p>
          </div>
        </div>
        <button
          onClick={handleViewProfile}
          className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
        >
          <span>View Full Profile</span>
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
};

export default UserProfileModal;
