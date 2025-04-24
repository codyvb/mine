import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { gameId } = await req.json();
  const fid = await getFidFromRequest(req);
  if (!fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch game and validate ownership
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (error || !game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (game.fid !== fid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (game.ended_at) return NextResponse.json({ error: 'Game already ended' }, { status: 400 });

  // Mark as won, end the game
  const ended_at = new Date().toISOString();
  await supabase
    .from('games')
    .update({ won: true, ended_at })
    .eq('id', gameId);

  // Calculate gems collected in this game
  const gemsCollected = Array.isArray(game.revealed_positions) ? game.revealed_positions.length : 0;

  // Increment user's total_gems
  if (gemsCollected > 0) {
    // Fetch current total_gems
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_gems')
      .eq('fid', fid)
      .single();
    if (!userError && user) {
      const newTotal = (user.total_gems || 0) + gemsCollected;
      await supabase
        .from('users')
        .update({ total_gems: newTotal })
        .eq('fid', fid);
    }
  }

  return NextResponse.json({
    gameOver: true,
    won: true,
    minePositions: game.mine_positions,
    revealed: game.revealed_positions,
  });
}
