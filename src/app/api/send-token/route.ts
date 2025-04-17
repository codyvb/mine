import { NextResponse } from 'next/server';
import { parseUnits, JsonRpcProvider, Wallet, Contract } from 'ethers';

const TOKEN_ADDRESS = '0xF4123bC7E8849C009fcaf4D5C5E9F847BbD60f6B';
const TO_ADDRESS = '0x40FF52E1848660327F16ED96a307259Ec1D757eB';
const AMOUNT = parseUnits('1', 18); // 1 token, 18 decimals
const BASE_RPC_URL = process.env.BASE_RPC_URL;
const BASE_PRIVATE_KEY = process.env.BASE_PRIVATE_KEY;

const ERC20_ABI = [
  'function transfer(address to, uint amount) public returns (bool)'
];

export async function POST() {
  if (!BASE_PRIVATE_KEY || !BASE_RPC_URL) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  try {
    const provider = new JsonRpcProvider(BASE_RPC_URL);
    const wallet = new Wallet(BASE_PRIVATE_KEY, provider);
    const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
    const tx = await token.transfer(TO_ADDRESS, AMOUNT);
    await tx.wait();
    return NextResponse.json({ hash: tx.hash });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
