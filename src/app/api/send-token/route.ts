import { NextResponse } from 'next/server';
import { parseUnits, JsonRpcProvider, Wallet, Contract } from 'ethers';

const TOKEN_ADDRESS = '0xF4123bC7E8849C009fcaf4D5C5E9F847BbD60f6B';
// TO_ADDRESS will be determined dynamically from Neynar
const AMOUNT = parseUnits('1', 18); // 1 token, 18 decimals
const BASE_RPC_URL = process.env.BASE_RPC_URL;
const BASE_PRIVATE_KEY = process.env.BASE_PRIVATE_KEY;

const ERC20_ABI = [
  'function transfer(address to, uint amount) public returns (bool)'
];

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

  try {
    const provider = new JsonRpcProvider(BASE_RPC_URL);
    const wallet = new Wallet(BASE_PRIVATE_KEY, provider);
    const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
    const tx = await token.transfer(ethAddress, AMOUNT);
    await tx.wait();
    return NextResponse.json({ hash: tx.hash });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
