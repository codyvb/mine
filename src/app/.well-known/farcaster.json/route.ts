export async function GET() {
  const appUrl = "https://gems.rip"  ;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjc0NiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM3NUMxZEU1Nzk1MTRkOTBEYTcwMjc1MDdFMkM0N0M5MzkzMUQxQjcifQ",
      payload: "eyJkb21haW4iOiJnZW1zLnJpcCJ9",
      signature: "MHg2MjQzMWIyYjAxNzk3Y2E2MDM1YmIxZWE1M2Q3Y2RjNjNlMTExNzVhNDM3NDQyZmM0ZWNjMDhmNzc5NzcwMmZjNmRkN2RiYjIxNDBmY2UzOGExMjNkOTViYzZkNzQzYjBiNGE1YjMxNTlhNTVlYjAzOTlmMzM0YWE4OGM0YmI5NjBi"
    },  
    frame: {
      version: "next",
      name: "Gems",
      iconUrl: `${appUrl}/icon6.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/card8.png`,
      buttonTitle: "Launch",
      splashImageUrl: `${appUrl}/icon6.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `https://api.neynar.com/f/app/2a8bcec6-2ca4-423a-86c2-4bd8e0479164/event`,
    },
  };

  return Response.json(config);
}
