import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route
import { DateTime } from "luxon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // --- 1. Get user FID ---
  const fid = await getFidFromRequest(req);
  if (!fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // --- 2. Get config: max plays only ---
  const { data: maxPlaysRow } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'max_plays')
    .maybeSingle();
  const maxPlays = maxPlaysRow && !isNaN(Number(maxPlaysRow.value)) ? Number(maxPlaysRow.value) : 10;

  // --- 3. Calculate current Denver/local time and daily period (DST-safe) ---
  const nowDenver = DateTime.now().setZone('America/Denver');
  const period = nowDenver.toISODate(); // YYYY-MM-DD, DST-safe and matches get-daily-plays
  // Optionally, calculate next reset for frontend (12pm Denver)
  let nextResetDenver = nowDenver.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (nowDenver >= nextResetDenver) {
    nextResetDenver = nextResetDenver.plus({ days: 1 });
  }


  // --- 7. Upsert user (for FK constraint) ---
  await supabase
    .from('users')
    .upsert({ fid, username: `user_${fid}` }, { onConflict: 'fid' });

  // --- 8. Get user's play count for this period ---
  const { data: existing } = await supabase
    .from('daily_plays')
    .select('count')
    .eq('fid', fid)
    .eq('play_date', period)
    .maybeSingle();

  // --- 9. Check tries and increment ---
  if (existing && existing.count >= maxPlays) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 403 });
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('daily_plays')
      .update({ count: Math.max(existing.count + 1, 0) })
      .eq('fid', fid)
      .eq('play_date', period);
    if (updateError) console.error('Supabase daily_plays update error:', updateError);
  } else {
    const { error: insertError } = await supabase
      .from('daily_plays')
      .insert({ fid, play_date: period, count: 1 });
    if (insertError) console.error('Supabase daily_plays insert error:', insertError);
  }

  // --- 10. Create game ---
  const mineCount = 3;
  const positions: number[] = [];
  while (positions.length < mineCount) {
    const r = Math.floor(Math.random() * 25);
    if (!positions.includes(r)) positions.push(r);
  }

  const { data: game, error: gameInsertError } = await supabase
    .from('games')
    .insert({
      fid,
      mine_positions: positions,
    })
    .select()
    .single();

  if (gameInsertError) {
    console.error('Supabase game insert error:', gameInsertError);
    return NextResponse.json({ error: 'Supabase insert error', details: gameInsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    gameId: game.id,
    mineCount,
    gridSize: 25,
    revealedPositions: [],
  });
}
