import Groq from 'groq-sdk';

/**
 * Get the Groq client initialized with the API key from localStorage.
 */
function getGroqClient() {
  const apiKey = localStorage.getItem('groq_api_key');
  if (!apiKey) {
    throw new Error('Groq API key not found in localStorage. Please add it in Settings.');
  }
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
}

/**
 * Get music recommendations based on an array of recently played tracks.
 * Returns a JSON structure containing suggested queries/genres.
 */
export async function getRecommendations(recentTracks) {
  if (!recentTracks || recentTracks.length === 0) {
    return { queries: [{ query: 'trending pop', genre: 'Pop' }] };
  }

  const trackListString = recentTracks
    .map(t => `'${t.track_name}' by ${t.artist_name}`)
    .join(', ');

  const prompt = `The user has recently listened to the following tracks: ${trackListString}.
Based on this, suggest 5 YouTube Music search queries to find similar or recommended music. 
Return ONLY JSON in the following format:
{ "queries": [{ "query": "string (artist or song or genre)", "genre": "string", "reason": "string" }] }`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const resultString = chatCompletion.choices[0]?.message?.content || '{}';
    return JSON.parse(resultString);
  } catch (error) {
    console.error('Groq recommendation error:', error);
    const artists = [...new Set(recentTracks.map((track) => track.artist_name || track.artist).filter(Boolean))];
    const names = [...new Set(recentTracks.map((track) => track.track_name || track.name).filter(Boolean))];

    return {
      queries: [
        ...artists.slice(0, 3).map((artist) => ({
          query: `${artist} songs`,
          genre: 'Artist radio',
          reason: `Based on your recent plays from ${artist}`,
        })),
        ...names.slice(0, 2).map((name) => ({
          query: `${name} similar songs`,
          genre: 'Similar songs',
          reason: `More tracks with a similar feel to ${name}`,
        })),
      ].slice(0, 5),
    };
  }
}
