"use client";
import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import sdk from "@farcaster/frame-sdk";

interface GameActivity {
  id: number;
  fid: number;
  started_at: string;
  ended_at?: string | null;
  won?: boolean | null;
  mine_positions: number[];
  revealed_positions: number[];
  users?: {
    username?: string;
    display_name?: string;
    pfp_url?: string;
  };
}

export default function ActivityFeed() {
  const [games, setGames] = useState<GameActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) {
          const text = await res.text();
          setError(`API error: ${res.status} ${text}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        console.log("DEBUG activity API result:", data);
        setGames(data.games || []);
      } catch (err: any) {
        setError("Network or JS error: " + (err?.message || err));
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  if (loading) return <div className="text-center py-8">Loading activity...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!games.length) return <div className="text-center py-8">No recent activity.</div>;

  // Helper to format time as '31s ago', '2m ago', etc.
  // Use server-provided local time as the reference
  // Always use the current local time in UTC for accurate comparison
  const LOCAL_NOW = DateTime.now().toUTC();
  function timeAgo(ended_at: string | null | undefined) {
    if (!ended_at) return '? ago';
    try {
      // Parse ended_at as UTC
      const gameTime = DateTime.fromISO(ended_at, { zone: 'utc' });
      // Convert LOCAL_NOW to UTC for accurate diff
      const localNowUtc = LOCAL_NOW.setZone('utc');
      const diff = localNowUtc.diff(gameTime, ["days", "hours", "minutes", "seconds"]).toObject();
      // Only show 'just now' if less than 10 seconds ago
      if ((diff.seconds ?? 0) < 10 && (diff.seconds ?? 0) >= 0 && (diff.minutes ?? 0) === 0 && (diff.hours ?? 0) === 0 && (diff.days ?? 0) === 0) {
        return 'just now';
      }
      if (diff.days && diff.days >= 1) return `${Math.floor(diff.days)}d ago`;
      if (diff.hours && diff.hours >= 1) return `${Math.floor(diff.hours)}h ago`;
      if (diff.minutes && diff.minutes >= 1) return `${Math.floor(diff.minutes)}m ago`;
      if (diff.seconds !== undefined) return `${Math.floor(diff.seconds)}s ago`;
      return '? ago';
    } catch (e) {
      return '? ago';
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto divide-y divide-neutral-800">
      {games.filter(game => !!game.ended_at).map((game, idx) => {
        const user = game.users || {};
        const name = user.display_name || user.username || `User ${game.fid}`;
        const avatar = user.pfp_url || "/default-avatar.png";
        // Use ended_at for time-ago if present, else fallback to started_at
        // Always use started_at for time display
        const handleUserClick = async (e: React.MouseEvent) => {
          e.preventDefault();
          if (sdk && sdk.actions && typeof sdk.actions.viewProfile === "function") {
            try {
              await sdk.actions.viewProfile({ fid: game.fid });
            } catch {}
          }
        };
        return (
          <div
            key={game.id || idx}
            className="flex items-center py-2 w-full"
            style={{ minHeight: 56 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="flex items-center gap-2 focus:outline-none group"
                onClick={handleUserClick}
                title={`View @${user.username || user.display_name || game.fid} on Farcaster`}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                tabIndex={0}
              >
                <img
                  src={avatar}
                  alt={name}
                  className="w-8 h-8 rounded-full border border-neutral-700 bg-neutral-800 group-hover:border-purple-500 transition-colors"
                  style={{ flexShrink: 0 }}
                />
                <span className="text-base text-white truncate max-w-[110px] group-hover:text-purple-400 transition-colors">{name}</span>
              </button>
              <span className="text-base text-neutral-300 ml-2 whitespace-nowrap">{timeAgo(game.ended_at)}</span>
            </div>
            {game.won === true && (
              <span className="flex items-center text-cyan-300 text-base ml-auto">
                +
                <img src="/tokens/horse.png" alt="horse" className="w-6 h-6 ml-1 inline-block align-middle" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}


