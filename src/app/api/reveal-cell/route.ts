import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { gameId, cellIndex } = await req.json();
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

  // Check if cell already revealed
  if (game.revealed_positions && game.revealed_positions.includes(cellIndex)) {
    return NextResponse.json({ error: 'Cell already revealed' }, { status: 400 });
  }

  // Update revealed positions
  const revealed = [...(game.revealed_positions || []), cellIndex];
  let won = false;
  let ended_at = null;
  let isMine = false;

  if (game.mine_positions.includes(cellIndex)) {
    // Hit a mine: game over
    ended_at = new Date().toISOString();
    isMine = true;
  } else if (revealed.length === 25 - game.mine_positions.length) {
    // All safe cells revealed: win
    won = true;
    ended_at = new Date().toISOString();
  }

  await supabase
    .from('games')
    .update({ revealed_positions: revealed, won, ended_at })
    .eq('id', gameId);

  return NextResponse.json({
    isMine,
    revealed,
    gameOver: !!ended_at,
    won,
    // Only reveal mine positions if game is over
    minePositions: ended_at ? game.mine_positions : undefined,
  });
}
