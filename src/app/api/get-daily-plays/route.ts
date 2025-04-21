import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFidFromRequest } from '../../../lib/auth'; // Use relative path for API route
import { DateTime } from "luxon";

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

  // 1. Use Luxon to get the current time in America/Denver (DST-safe)
  const nowDenver = DateTime.now().setZone('America/Denver');

  // Calculate the start and end of the current play window (12pm MST to next 12pm MST)
  let windowStart = nowDenver.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (nowDenver < windowStart) {
    windowStart = windowStart.minus({ days: 1 });
  }
  let nextResetDenver = windowStart.plus({ days: 1 });

  // TEMP: Log for debugging
  console.log('[get-daily-plays] nowDenver:', nowDenver.toISO(), 'windowStart:', windowStart.toISO(), 'nextResetDenver:', nextResetDenver.toISO());

  // 2. Get user's play count from daily_plays for this window (using played_at timestamptz)
  const { data: playRows, error: dailyPlaysError } = await supabase
    .from('daily_plays')
    .select('count')
    .eq('fid', fid)
    .gte('played_at', windowStart.toISO())
    .lt('played_at', nextResetDenver.toISO());
  if (dailyPlaysError) {
    return NextResponse.json({ error: 'Failed to get daily plays' }, { status: 500 });
  }
  const playCount = playRows?.reduce((sum, row) => sum + row.count, 0) || 0;
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

  // 3. Return next communal reset (12pm Denver time daily)
  // nextResetDenver was already calculated above
  // Use nextResetDenver in UTC for both fields; this is 12pm in Denver time (converted to UTC)
  return NextResponse.json({
    playsLeft,
    nextReset: nextResetDenver.toUTC().toISO(),
    communalResetAt: nextResetDenver.toUTC().toISO(),
  });
}
