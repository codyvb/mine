export async function GET() {
  const appUrl = "https://gems.rip"  ;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjc0NiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM3NUMxZEU1Nzk1MTRkOTBEYTcwMjc1MDdFMkM0N0M5MzkzMUQxQjcifQ",
      payload: "eyJkb21haW4iOiJnZW1zLnJpcCJ9",
      signature: "MHg2MjQzMWIyYjAxNzk3Y2E2MDM1YmIxZWE1M2Q3Y2RjNjNlMTExNzVhNDM3NDQyZmM0ZWNjMDhmNzc5NzcwMmZjNmRkN2RiYjIxNDBmY2UzOGExMjNkOTViYzZkNzQzYjBiNGE1YjMxNTlhNTVlYjAzOTlmMzM0YWE4OGM0YmI5NjFi"
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
