import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route

// Ensure env vars are present
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req: Request): Promise<Response> {
  const fid = await getFidFromRequest(req);
  if (!fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Calculate current MST time and daily period (no config needed)
  const nowUtc = new Date();
  const nowMST = new Date(nowUtc.getTime() - 7 * 60 * 60 * 1000);
  // Find most recent 12pm MST
  const resetMST = new Date(nowMST);
  resetMST.setHours(12, 0, 0, 0);
  if (nowMST < resetMST) {
    resetMST.setDate(resetMST.getDate() - 1);
  }
  const period = resetMST.toISOString().slice(0, 10);
  // Optionally, calculate next reset for frontend
  const nextResetMST = new Date(resetMST);
  nextResetMST.setDate(resetMST.getDate() + 1);
  nextResetMST.setHours(12, 0, 0, 0);

  // 2. Get user's play count from daily_plays for this period (same as start-game)
  const { data: existing, error: dailyPlaysError } = await supabase
    .from('daily_plays')
    .select('count')
    .eq('fid', fid)
    .eq('play_date', period)
    .maybeSingle();
  if (dailyPlaysError) {
    return NextResponse.json({ error: 'Failed to get daily plays' }, { status: 500 });
  }
  const playCount = existing?.count || 0;
  // Fetch maxPlays from config
  const { data: maxPlaysRow, error: maxPlaysError } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'max_plays')
    .maybeSingle();
  if (maxPlaysError || !maxPlaysRow) {
    return NextResponse.json({ error: 'Config for max_plays missing' }, { status: 500 });
  }
  // Only use config value for maxPlays. No fallback allowed.
  // This is intentional, as we want to ensure that the config table is the single source of truth for maxPlays.
  const maxPlays = parseInt(maxPlaysRow.value, 10);
  if (isNaN(maxPlays)) {
    return NextResponse.json({ error: 'Config for max_plays invalid' }, { status: 500 });
  }
  const playsLeft = Math.max(0, maxPlays - (playCount || 0));

  // 3. Return next communal reset (12pm MST daily)
  // nextResetMST was already calculated above
  return NextResponse.json({
    playsLeft,
    nextReset: nextResetMST.toISOString(),
    communalResetAt: nextResetMST.toISOString(),
  });
}
