const JAMENDO_API = 'https://api.jamendo.com/v3.0';
const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || 'c672fb4c';

const defaultTrackParams = {
  client_id: JAMENDO_CLIENT_ID,
  format: 'json',
  limit: '20',
  include: 'musicinfo',
  audioformat: 'mp32',
  audiodlformat: 'mp32',
  imagesize: '300',
};

function jamendoUrl(endpoint, params = {}) {
  const searchParams = new URLSearchParams({
    ...defaultTrackParams,
    ...params,
  });

  return `${JAMENDO_API}${endpoint}/?${searchParams}`;
}

async function fetchJamendo(endpoint, params) {
  const res = await fetch(jamendoUrl(endpoint, params));

  if (!res.ok) {
    throw new Error(`Jamendo request failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.headers?.status && data.headers.status !== 'success') {
    throw new Error(data.headers.error_message || 'Jamendo request failed');
  }

  return data.results || [];
}

function normalizeTrack(track) {
  return {
    id: String(track.id),
    name: track.name,
    artist: track.artist_name || 'Unknown Artist',
    thumbnail: track.album_image || track.image || '',
    streamUrl: track.audio,
    downloadUrl: track.audiodownload_allowed ? track.audiodownload : '',
    downloadAllowed: Boolean(track.audiodownload_allowed && track.audiodownload),
    duration: Number(track.duration) || 0,
    album: track.album_name || '',
    source: 'jamendo',
  };
}

/**
 * Search Jamendo for streamable independent music.
 * @param {string} query
 * @returns {Promise<Array>} array of track objects
 */
export async function searchTracks(query) {
  const results = await fetchJamendo('/tracks', {
    search: query,
    limit: '20',
  });

  return results.map(normalizeTrack).filter((track) => track.streamUrl);
}

/**
 * Get a playable stream URL for a Jamendo track id.
 * @param {string} trackId
 * @returns {Promise<{url: string, mimeType: string, bitrate: number}>}
 */
export async function getStreamUrl(trackId) {
  return {
    url: getPlayableAudioUrl(trackId),
    mimeType: 'audio/mpeg',
    bitrate: 192000,
  };
}

export function getPlayableAudioUrl(trackId) {
  return jamendoUrl('/tracks/file', {
    id: trackId,
    action: 'stream',
  });
}

/**
 * Fetch home page shelves using Jamendo featured genre charts.
 * @returns {Promise<{shelves: Array}>}
 */
export async function getHomeShelves() {
  const shelves = [
    { title: 'Featured Pop', params: { tags: 'pop', featured: '1' } },
    { title: 'Electronic Picks', params: { tags: 'electronic', featured: '1' } },
    { title: 'Rock Essentials', params: { tags: 'rock', featured: '1' } },
    { title: 'Hip-Hop Finds', params: { tags: 'hiphop', featured: '1' } },
  ];

  const results = await Promise.all(
    shelves.map(async (shelf) => {
      const tracks = await fetchJamendo('/tracks', {
        ...shelf.params,
        limit: '10',
        groupby: 'artist_id',
      });

      return {
        title: shelf.title,
        items: tracks.map(normalizeTrack).filter((track) => track.streamUrl),
      };
    })
  );

  return { shelves: results.filter((shelf) => shelf.items.length > 0) };
}

/**
 * Fetch lyrics from LRCLib directly when available.
 */
export async function getLyrics(trackName, artistName, duration) {
  const params = new URLSearchParams({ track_name: trackName, artist_name: artistName });
  if (duration) params.append('duration', duration);

  try {
    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'Lrclib-Client': 'Audiosa/1.0' },
    });

    if (!res.ok) return { syncedLyrics: null, plainLyrics: null };
    const data = await res.json();

    return {
      syncedLyrics: data.syncedLyrics || null,
      plainLyrics: data.plainLyrics || null,
    };
  } catch {
    return { syncedLyrics: null, plainLyrics: null };
  }
}
