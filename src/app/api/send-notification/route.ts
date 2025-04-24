import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Hardcode FID and Frame ID for this test
  const fid = 746;
  const frame_id = "2a8bcec6-2ca4-423a-86c2-4bd8e0479164";
  const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;

  const payload = {
    frame_id,
    recipients: [fid],
    notification: {
      title: "Your tries are replenished!",
      body: "You can now play Gems again. Come back and win!",
      image: "https://www.gems.rip/card8.png",
    },
  };

  const res = await fetch("https://api.neynar.com/v2/frames/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_key": NEYNAR_API_KEY || "",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return Response.json(data, { status: res.ok ? 200 : 500 });
}
