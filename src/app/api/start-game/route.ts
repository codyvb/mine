import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const fid = await getFidFromRequest(req);
  if (!fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];

  // Upsert user to satisfy foreign key constraint
  await supabase
    .from('users')
    .upsert({ fid, username: `user_${fid}` }, { onConflict: 'fid' });

  const { data: existing } = await supabase
    .from('daily_plays')
    .select('count')
    .eq('fid', fid)
    .eq('play_date', today)
    .maybeSingle();

  // Fetch max_plays from config table
  let maxPlays = 1000000; // fallback default
  const { data: configRow } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'max_plays')
    .maybeSingle();
  if (configRow && !isNaN(Number(configRow.value))) {
    maxPlays = Number(configRow.value);
  }

  if (existing && existing.count >= maxPlays) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 403 });
  }

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

  if (existing) {
    const { error: updateError } = await supabase
      .from('daily_plays')
      .update({ count: existing.count + 1 })
      .eq('fid', fid)
      .eq('play_date', today);
    if (updateError) console.error('Supabase daily_plays update error:', updateError);
  } else {
    const { error: insertError } = await supabase
      .from('daily_plays')
      .insert({ fid, play_date: today });
    if (insertError) console.error('Supabase daily_plays insert error:', insertError);
  }

  return NextResponse.json({
    gameId: game.id,
    mineCount,
    gridSize: 25,
    revealedPositions: [],
  });
}
