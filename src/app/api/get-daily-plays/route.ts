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

  // 1. Use the provided local time as the source of truth for all calculations.
  // Update this to use an environment variable or request header in production. For now, hardcode for debugging:
  const localTimeStr = '2025-04-21T00:56:14-06:00'; // <-- Replace with dynamic value in production
  const localTime = new Date(localTimeStr);

  // Calculate next reset: 12:00:00 PM on the same or next day, preserving the offset
  const nextReset = new Date(localTime);
  nextReset.setHours(12, 0, 0, 0);
  if (localTime >= nextReset) {
    // If after 12pm, set to 12pm tomorrow
    nextReset.setDate(nextReset.getDate() + 1);
  }
  // The period is the date portion for today (for play tracking)
  const period = localTime.toISOString().slice(0, 10);
  // TEMP: Log for debugging
  console.log('[get-daily-plays] localTime:', localTime.toISOString(), 'nextReset:', nextReset.toISOString());
  // This logic ensures the reset is always at 12pm in the user's local offset (e.g., -06:00 for MDT).

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
  // Use nextReset.toISOString() for both fields; this is 12pm in the user's local offset
  return NextResponse.json({
    playsLeft,
    nextReset: nextReset.toISOString(),
    communalResetAt: nextReset.toISOString(),
  });
}
