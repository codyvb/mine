import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // --- 1. Get user FID ---
  const fid = await getFidFromRequest(req);
  if (!fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // --- 2. Get config: reset time and max plays ---
  const { data: resetRow } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'tries_reset_at')
    .maybeSingle();
  const { data: maxPlaysRow } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'max_plays')
    .maybeSingle();
  const maxPlays = maxPlaysRow && !isNaN(Number(maxPlaysRow.value)) ? Number(maxPlaysRow.value) : 10;

  // --- 3. Get current MST time ---
  const now = new Date();
  // MST is UTC-7 (no DST logic for simplicity)
  const nowMST = new Date(now.getTime() - 7 * 60 * 60 * 1000);

  // --- 4. Parse/reset period ---
  let resetAt = resetRow ? new Date(resetRow.value) : null;
  if (!resetAt || isNaN(resetAt.getTime())) {
    // If not set, default to next 12pm MST
    resetAt = new Date(nowMST);
    resetAt.setHours(12, 0, 0, 0);
    if (nowMST > resetAt) resetAt.setDate(resetAt.getDate() + 1);
    await supabase.from('config').upsert({ key: 'tries_reset_at', value: resetAt.toISOString() }, { onConflict: 'key' });
  }

  // --- 5. If now > resetAt, update resetAt for next day and reset all counts ---
  if (nowMST > resetAt) {
    // Set next reset to next 12pm MST
    const nextReset = new Date(resetAt);
    nextReset.setDate(resetAt.getDate() + 1);
    nextReset.setHours(12, 0, 0, 0);
    await supabase.from('config').update({ value: nextReset.toISOString() }).eq('key', 'tries_reset_at');
    // Option 1: Reset all counts to 0
    await supabase.rpc('reset_daily_plays');
    // Option 2: Alternatively, use period logic (not implemented here)
    resetAt = nextReset;
  }

  // --- 6. Use the resetAt date as the period string (YYYY-MM-DD) ---
  const period = resetAt.toISOString().slice(0, 10);

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
