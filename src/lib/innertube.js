const API_BASE = '/api';

/**
 * Search YouTube Music via InnerTube proxy
 * @param {string} query
 * @returns {Promise<Array>} array of track objects
 */
export async function searchTracks(query) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.tracks || [];
}

/**
 * Get the best audio stream URL for a given video ID
 * @param {string} videoId
 * @returns {Promise<{url: string, mimeType: string, bitrate: number}>}
 */
export async function getStreamUrl(videoId) {
  const res = await fetch(`${API_BASE}/stream/${videoId}`);
  if (!res.ok) throw new Error('Stream URL fetch failed');
  return res.json();
}

export function getPlayableAudioUrl(videoId) {
  return `${API_BASE}/audio/${videoId}`;
}

/**
 * Fetch home page shelves (trending/recommended)
 * @returns {Promise<{shelves: Array}>}
 */
export async function getHomeShelves() {
  const res = await fetch(`${API_BASE}/home`);
  if (!res.ok) throw new Error('Home fetch failed');
  return res.json();
}

/**
 * Fetch synced lyrics from LRCLib
 * @param {string} trackName
 * @param {string} artistName
 * @param {number} [duration] - in seconds
 */
export async function getLyrics(trackName, artistName, duration) {
  const params = new URLSearchParams({ track: trackName, artist: artistName });
  if (duration) params.append('duration', duration);
  const res = await fetch(`${API_BASE}/lyrics?${params}`);
  if (!res.ok) return { syncedLyrics: null, plainLyrics: null };
  return res.json();
}
