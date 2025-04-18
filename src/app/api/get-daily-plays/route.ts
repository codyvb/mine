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

  // 2. Count user's games since reset
  const { count: playCount, error: gamesError } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('fid', fid)
    .gte('started_at', resetAt.toISOString());
  if (gamesError) {
    return NextResponse.json({ error: 'Failed to count plays' }, { status: 500 });
  }
  const maxPlays = 30;
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
