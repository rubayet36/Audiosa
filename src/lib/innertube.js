import { apiUrl, fetchJson } from './api';

/**
 * Search YouTube Music via InnerTube proxy
 * @param {string} query
 * @returns {Promise<Array>} array of track objects
 */
export async function searchTracks(query) {
  const data = await fetchJson(`/search?q=${encodeURIComponent(query)}`);
  return data.tracks || [];
}

/**
 * Get the best audio stream URL for a given video ID
 * @param {string} videoId
 * @returns {Promise<{url: string, mimeType: string, bitrate: number}>}
 */
export async function getStreamUrl(videoId) {
  return fetchJson(`/stream/${videoId}`);
}

export function getPlayableAudioUrl(videoId) {
  return apiUrl(`/audio/${videoId}`);
}

/**
 * Fetch home page shelves (trending/recommended)
 * @returns {Promise<{shelves: Array}>}
 */
export async function getHomeShelves() {
  return fetchJson('/home');
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
  try {
    return await fetchJson(`/lyrics?${params}`);
  } catch {
    return { syncedLyrics: null, plainLyrics: null };
  }
}
