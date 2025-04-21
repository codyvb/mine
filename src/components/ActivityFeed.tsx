"use client";
import React, { useEffect, useState } from "react";

interface GameActivity {
  id: number;
  fid: number;
  started_at: string;
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

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      const res = await fetch("/api/activity");
      const data = await res.json();
      console.log("DEBUG activity API result:", data);
      setGames(data.games || []);
      setLoading(false);
    }
    fetchActivity();
  }, []);

  if (loading) return <div className="text-center py-8">Loading activity...</div>;
  if (!games.length) return <div className="text-center py-8">No recent activity.</div>;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {games.map((game) => (
        <div
          key={game.id}
          className="flex items-center gap-4 bg-neutral-900 rounded-xl px-4 py-3 shadow border border-neutral-800"
        >
          <img
            src={game.users && game.users.pfp_url ? game.users.pfp_url : `/default-avatar.png`}
            alt={game.users && (game.users.display_name || game.users.username) ? (game.users.display_name || game.users.username) : `User ${game.fid}`}
            className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-800"
          />
          <div className="flex flex-col">
            <span className="font-mono text-lg">
              {(game.users && (game.users.display_name || game.users.username)) ? (game.users.display_name || game.users.username) : `User ${game.fid}`}
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(game.started_at).toLocaleString()}
            </span>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-xs text-neutral-400">
              Mines: {game.mine_positions.length} | Revealed: {game.revealed_positions.length}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
