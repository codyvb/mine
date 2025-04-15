// Utility to extract fid from Farcaster-authenticated request
// Looks for 'x-fid' header (sent from client). Optionally, verify 'x-farcaster-token' here.

export async function getFidFromRequest(req: Request): Promise<number | null> {
  const fidHeader = req.headers.get('x-fid');
  if (!fidHeader) return null;
  const fid = parseInt(fidHeader, 10);
  if (isNaN(fid)) return null;
  // Optionally: verify x-farcaster-token here
  return fid;
}
