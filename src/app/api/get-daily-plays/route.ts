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

  // 1. Fetch communal reset time from config
  const { data: configRow, error: configError } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'tries_reset_at')
    .maybeSingle();
  if (configError || !configRow) {
    return NextResponse.json({ error: 'Config not found' }, { status: 500 });
  }
  const resetAt = new Date(configRow.value);
  const period = resetAt.toISOString().slice(0, 10);

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

  // 3. Calculate next communal reset (assume daily at same UTC time)
  const now = new Date();
  let nextReset = new Date(resetAt);
  if (now >= resetAt) {
    nextReset.setUTCDate(resetAt.getUTCDate() + 1);
  }

  return NextResponse.json({
    playsLeft,
    nextReset: nextReset.toISOString(),
    communalResetAt: resetAt.toISOString(),
  });
}
