import { getPlayableAudioUrl } from './innertube';

const DB_NAME = 'audiosa_downloads';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

function openDownloadsDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runStore(mode, callback) {
  return openDownloadsDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = callback(store);

    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  }));
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getDownloadedTracks() {
  const tracks = await runStore('readonly', (store) => requestToPromise(store.getAll()));
  return tracks.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
}

export async function getDownloadedTrack(id) {
  return runStore('readonly', (store) => requestToPromise(store.get(id)));
}

export async function saveDownloadedTrack(track, blob) {
  const record = {
    id: track.id,
    name: track.name,
    artist: track.artist,
    thumbnail: track.thumbnail,
    streamUrl: track.streamUrl,
    downloadUrl: track.downloadUrl,
    downloadAllowed: track.downloadAllowed,
    source: track.source,
    mimeType: blob.type || 'audio/webm',
    size: blob.size,
    downloadedAt: new Date().toISOString(),
    blob,
  };

  await runStore('readwrite', (store) => store.put(record));
  return record;
}

export async function removeDownloadedTrack(id) {
  await runStore('readwrite', (store) => store.delete(id));
}

export async function downloadTrackToLibrary(track) {
  if (!track?.id) throw new Error('Track id is missing');
  if (track.downloadAllowed === false) {
    throw new Error('This artist has disabled downloads for this track.');
  }

  const sourceUrl = track.downloadUrl || track.streamUrl || getPlayableAudioUrl(track.id);
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Download failed');
  }

  const blob = await res.blob();
  return saveDownloadedTrack(track, blob);
}

export function createDownloadedTrackUrl(track) {
  if (!track?.blob) return null;
  return URL.createObjectURL(track.blob);
}

export function browserDownloadUrl(track) {
  if (track?.blob) return URL.createObjectURL(track.blob);
  return track?.downloadUrl || track?.streamUrl || '#';
}
