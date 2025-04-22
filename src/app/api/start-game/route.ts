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

  // --- 2. Get config: admin-specific max plays if present ---
  const adminKey = `max_plays_admin_${fid}`;
  let maxPlays: number | null = null;
  // Try admin key first
  const { data: adminMaxPlaysRow } = await supabase
    .from('config')
    .select('value')
    .eq('key', adminKey)
    .maybeSingle();
  if (adminMaxPlaysRow && !isNaN(Number(adminMaxPlaysRow.value))) {
    maxPlays = Number(adminMaxPlaysRow.value);
  } else {
    // Fallback to normal max_plays
    const { data: maxPlaysRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'max_plays')
      .maybeSingle();
    maxPlays = maxPlaysRow && !isNaN(Number(maxPlaysRow.value)) ? Number(maxPlaysRow.value) : 10;
  }

  // --- 3. Calculate current Denver/local time and daily period (DST-safe) ---
  const nowDenver = DateTime.now().setZone('America/Denver');
  // Calculate the start and end of the current play window (12pm MST to next 12pm MST)
  let windowStart = nowDenver.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (nowDenver < windowStart) {
    windowStart = windowStart.minus({ days: 1 });
  }
  let nextResetDenver = windowStart.plus({ days: 1 });


  // --- 7. Upsert user (for FK constraint) ---
  await supabase
    .from('users')
    .upsert({ fid, username: `user_${fid}` }, { onConflict: 'fid' });

  // --- 8. Get user's play count for this period ---
  const { data: playRows } = await supabase
    .from('daily_plays')
    .select('count, played_at')
    .eq('fid', fid)
    .gte('played_at', windowStart.toUTC().toISO())
    .lt('played_at', nextResetDenver.toUTC().toISO());

  // Sum up play count in current window
  const totalCount = playRows?.reduce((sum, row) => sum + row.count, 0) || 0;

  // --- 9. Check tries and increment ---
  if (totalCount >= maxPlays) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 403 });
  }

  // Always insert a new play event with played_at as now (UTC)
  const { error: insertError } = await supabase
    .from('daily_plays')
    .insert({ fid, played_at: nowDenver.toUTC().toISO(), count: 1 });
  if (insertError) console.error('Supabase daily_plays insert error:', insertError);


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
