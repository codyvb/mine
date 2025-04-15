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

  return NextResponse.json({
    gameOver: true,
    won: true,
    minePositions: game.mine_positions,
    revealed: game.revealed_positions,
  });
}
