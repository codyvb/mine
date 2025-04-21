import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/activity - latest game activity with user info
export async function GET() {
  // Get latest 20 games with user info
  const { data, error } = await supabase
    .from('games')
    .select('id, fid, started_at, ended_at, won, mine_positions, revealed_positions, users:fid (username, display_name, pfp_url)')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ games: data });
}
