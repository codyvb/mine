import { NextResponse } from 'next/server';
import { parseUnits, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { createClient } from '@supabase/supabase-js';

const TOKEN_ADDRESS = '0x831f74f796f2f79d65ac5cdc6e813d807d9de54b';
const BASE_RPC_URL = process.env.BASE_RPC_URL;
const BASE_PRIVATE_KEY = process.env.BASE_PRIVATE_KEY;

const ERC20_ABI = [
  'function transfer(address to, uint amount) public returns (bool)'
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function POST(req: Request) {
  if (!BASE_PRIVATE_KEY || !BASE_RPC_URL || !process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  // Accept fid from header or body
  let fid: string | undefined;
  try {
    // Try header first (x-fid)
    fid = req.headers.get('x-fid') || undefined;
    if (!fid) {
      // Try JSON body
      const body = await req.json().catch(() => null);
      fid = body?.fid?.toString();
    }
    if (!fid) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Look up user's verified address using Neynar
  let ethAddress: string | undefined;
  try {
    const resp = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY,
      },
    });
    const data = await resp.json();
    ethAddress = data?.users?.[0]?.verified_addresses?.eth_addresses?.[0];
    if (!ethAddress) {
      return NextResponse.json({ error: 'No verified Ethereum address for this user.' }, { status: 404 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch user address from Neynar' }, { status: 500 });
  }

  // Look up most recent unclaimed win for this FID
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('fid', fid)
    .eq('won', true)
    .is('claimed_at', null)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !game) {
    return NextResponse.json({ error: 'No unclaimed win found for this user.' }, { status: 404 });
  }
  const amountToSend = Array.isArray(game.revealed_positions) ? game.revealed_positions.length : 1; // fallback to 1
  if (!amountToSend || amountToSend < 1) {
    return NextResponse.json({ error: 'No winnings to send.' }, { status: 400 });
  }

  try {
    const provider = new JsonRpcProvider(BASE_RPC_URL);
    const wallet = new Wallet(BASE_PRIVATE_KEY, provider);
    const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
    const tx = await token.transfer(ethAddress, parseUnits(amountToSend.toString(), 18));
    await tx.wait();
    // Mark this game as claimed
    await supabase
      .from('games')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', game.id);
    return NextResponse.json({ hash: tx.hash, amount: amountToSend, to: ethAddress });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
