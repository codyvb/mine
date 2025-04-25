export async function GET() {
  const appUrl = "https://gems.rip"  ;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjc0NiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM3NUMxZEU1Nzk1MTRkOTBEYTcwMjc1MDdFMkM0N0M5MzkzMUQxQjcifQ",
      payload: "eyJkb21haW4iOiJ3d3cuZ2Vtcy5yaXAifQ",
      signature: "MHg3YjQ3Y2RmOWMwYWVhMzU0YTFlZmM3MTFjZTlmN2Y2OTI3MTJiZjY5ZDcyZjQ1NjQzYjJjN2UyNGFjOGZkZTI4MDFkMDU2NmQxMTY4MTgxNjI2ZGU0Nzg5ZTg1MGZhMDc3NTIwOGQ3N2QyMWQ3MmY2MzgzOGYxNWRkNjBiODk4ZjFj"
    },  
    frame: {
      version: "next",
      name: "Gems",
      iconUrl: `${appUrl}/icon6.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/card8.png`,
      buttonTitle: "Launch",
      splashImageUrl: `${appUrl}/icon6.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `https://api.neynar.com/f/app/2a8bcec6-2ca4-423a-86c2-4bd8e0479164/event`,
    },
  };

  return Response.json(config);
}