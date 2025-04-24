import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface LeaderboardUser {
  fid: number;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  total_gems: number;
}

const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setUsers(data.leaderboard || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load leaderboard');
        setLoading(false);
      });
  }, [isOpen]);

  // Prevent background scroll lock by stopping touchmove propagation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      if (el.scrollHeight > el.clientHeight) {
        // Only stop propagation if not at the top or bottom (allow bounce)
        const atTop = el.scrollTop === 0;
        const atBottom = el.scrollTop + el.clientHeight === el.scrollHeight;
        if (!atTop && !atBottom) e.stopPropagation();
      }
    };
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, []);

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
      <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-[422px] min-w-[374px] mx-4 relative flex flex-col h-[80vh] min-h-[400px] max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 text-white text-lg font-bold p-1 hover:bg-neutral-800 rounded"
          aria-label="Close"
        >
          ×
        </button>
        <h1 className="text-2xl text-center mb-4">Leaderboard</h1>
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto w-full modal-scroll"
        >
          {loading ? (
            <div className="text-center text-neutral-300 py-8 min-w-[352px]">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-8 min-w-[352px]">{error}</div>
          ) : (
            users.length === 0 ? (
              <div className="text-center text-neutral-400 py-8 min-w-[352px]">No leaderboard data yet.</div>
            ) : (
              <ol className="w-full">
                {users.map((user, idx) => (
                  <li
                    key={user.fid}
                    className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-b-0 cursor-pointer hover:bg-neutral-800 transition-colors group"
                    tabIndex={0}
                    role="button"
                    aria-label={`Open Farcaster profile for ${user.display_name || user.username || `FID ${user.fid}`}`}
                    onClick={e => {
                      e.stopPropagation();
                      if (typeof window !== 'undefined') {
                        import('@farcaster/frame-sdk').then(sdkModule => {
                          const sdk = sdkModule.default || sdkModule;
                          if (sdk && sdk.actions && typeof sdk.actions.viewProfile === 'function') {
                            sdk.actions.viewProfile({ fid: user.fid });
                          }
                        });
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof window !== 'undefined') {
                          import('@farcaster/frame-sdk').then(sdkModule => {
                            const sdk = sdkModule.default || sdkModule;
                            if (sdk && sdk.actions && typeof sdk.actions.viewProfile === 'function') {
                              sdk.actions.viewProfile({ fid: user.fid });
                            }
                          });
                        }
                      }
                    }}
                  >
                    <span className="w-6 text-right font-mono text-neutral-400">{idx + 1}</span>
                    {user.pfp_url ? (
                      <img src={String(user.pfp_url)} alt={String(user.display_name || user.username || `FID ${user.fid}`)} className="w-8 h-8 rounded-full object-cover border border-neutral-700 group-hover:ring-2 group-hover:ring-purple-500 transition" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-400 group-hover:ring-2 group-hover:ring-purple-500 transition" aria-label="No avatar">?</div>
                    )}
                    <span className="flex-1 truncate font-semibold text-white">{user.display_name || user.username || `FID ${user.fid}`}</span>
                    <span className="font-mono text-purple-300">{user.total_gems}</span>
                    <span className="ml-1 text-xs text-purple-400">gems</span>
                  </li>
                ))}
              </ol>
            )
          )}
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
};

export default LeaderboardModal;
