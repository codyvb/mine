export async function GET() {
  const appUrl = "https://www.gems.rip"  ;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjc0NiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM3NUMxZEU1Nzk1MTRkOTBEYTcwMjc1MDdFMkM0N0M5MzkzMUQxQjcifQ",
      payload: "eyJkb21haW4iOiJ3d3cuZ2Vtcy5yaXAifQ",
      signature: "MHg3YjQ3Y2RmOWMwYWVhMzU0YTFlZmM3MTFjZTlmN2Y2OTI3MTJiZjY5ZDcyZjQ1NjQzYjJjN2UyNGFjOGZkZTI4MDFkMDU2NmQxMTY4MTgxNjI2ZGU0Nzg5ZTg1MGZhMDc3NTIwOGQ3N2QyMWQ3MmY2MzgzOGYxNWRkNjBiODk4ZjFj"
    },  
    frame: {
      version: "1",
      name: "Gems",
      iconUrl: `${appUrl}/icon2.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/card.png`,
      buttonTitle: "Launch",
      splashImageUrl: `${appUrl}/icon2.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
