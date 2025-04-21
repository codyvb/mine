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

  // Calculate next reset: 12:00 PM today or tomorrow in Denver time
  let nextResetDenver = nowDenver.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (nowDenver >= nextResetDenver) {
    // If after 12pm, set to 12pm tomorrow
    nextResetDenver = nextResetDenver.plus({ days: 1 });
  }
  // Use the date portion for today for play tracking (in Denver time)
  const period = nowDenver.toISODate();
  // TEMP: Log for debugging
  console.log('[get-daily-plays] nowDenver:', nowDenver.toISO(), 'nextResetDenver:', nextResetDenver.toISO());
  // This logic ensures the reset is always at 12pm in America/Denver time (handles DST automatically).

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

  // 3. Return next communal reset (12pm Denver time daily)
  // nextResetDenver was already calculated above
  // Use nextResetDenver in UTC for both fields; this is 12pm in Denver time (converted to UTC)
  return NextResponse.json({
    playsLeft,
    nextReset: nextResetDenver.toUTC().toISO(),
    communalResetAt: nextResetDenver.toUTC().toISO(),
  });
}
