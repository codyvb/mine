import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const {
    user, // { fid, username, displayName, pfpUrl }
    location, // object (optional)
    client // { clientFid, added, safeAreaInsets, notificationDetails }
  } = body;

  if (!user?.fid) {
    return NextResponse.json({ error: 'Missing user.fid' }, { status: 400 });
  }

  // Upsert user info
  const { error } = await supabase.from('users').upsert({
    fid: user.fid,
    username: user.username,
    display_name: user.displayName,
    pfp_url: user.pfpUrl,
    location: location ? JSON.stringify(location) : null,
    client_fid: client?.clientFid ?? null,
    client_added: client?.added ?? null,
    safe_area_insets: client?.safeAreaInsets ? JSON.stringify(client.safeAreaInsets) : null,
    notification_details: client?.notificationDetails ? JSON.stringify(client.notificationDetails) : null,
  }, { onConflict: 'fid' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
