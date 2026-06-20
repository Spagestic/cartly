"use server";

export async function getScribeToken(): Promise<{
  token?: string;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { error: "ElevenLabs API key is not configured" };
  }

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      return {
        error: `Failed to get Scribe token (${response.status}): ${body}`,
      };
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      return { error: "No token returned from ElevenLabs" };
    }

    return { token: data.token };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to get Scribe token",
    };
  }
}
