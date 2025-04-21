import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ActivityFeed from './ActivityFeed';

const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 relative" onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', height: 520 }}>
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 text-white text-lg font-bold p-1 hover:bg-neutral-800 rounded"
          aria-label="Close"
        >
          ×
        </button>
        <h1 className="text-2xl font-mono text-center mb-4">Leaderboard</h1>
        {/* Activity feed scroll area */}
        <div
          ref={scrollRef}
          style={{ maxHeight: 320, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <ActivityFeed />
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
};

export default LeaderboardModal;
