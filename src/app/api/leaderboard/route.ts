import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Get top 100 users by total_gems
  const { data, error } = await supabase
    .from('users')
    .select('fid, username, display_name, pfp_url, total_gems')
    .neq('fid', 746)
    .order('total_gems', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leaderboard: data });
}
