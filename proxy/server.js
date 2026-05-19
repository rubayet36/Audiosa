/**
 * Audiosa InnerTube proxy server
 * Handles YouTube InnerTube API calls, stream extraction (via ytdl-core), and lyrics.
 * Run with: node proxy/server.js
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const app = express();
const PORT = process.env.PORT || 3001;
let cookiesFilePromise = null;

app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Audiosa proxy',
    status: 'ok',
    endpoints: ['/api/health', '/api/home', '/api/search?q=song'],
  });
});

app.get('/api/health', async (req, res) => {
  res.json({
    ok: true,
    cookiesConfigured: Boolean(process.env.YTDLP_COOKIES_FILE || process.env.YTDLP_COOKIES_CONTENT),
  });
});

function sanitizeFileName(value = 'audiosa-track') {
  return value
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90) || 'audiosa-track';
}

async function getCookiesFile() {
  if (process.env.YTDLP_COOKIES_FILE) return process.env.YTDLP_COOKIES_FILE;
  if (!process.env.YTDLP_COOKIES_CONTENT) return null;

  if (!cookiesFilePromise) {
    cookiesFilePromise = writeCookiesFile(process.env.YTDLP_COOKIES_CONTENT);
  }

  return cookiesFilePromise;
}

async function writeCookiesFile(content) {
  const cookiePath = path.join(tmpdir(), 'audiosa-youtube-cookies.txt');
  const normalizedContent = content.replace(/\\n/g, '\n');
  await writeFile(cookiePath, normalizedContent, 'utf8');
  return cookiePath;
}

function isYoutubeBotError(error) {
  return /sign in to confirm|not a bot|cookies-from-browser|authentication/i.test(error?.message || '');
}

// --- InnerTube Config ---
const INNERTUBE_CONFIG = {
  apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', // YouTube public web key
  clientName: 'WEB_REMIX',
  clientVersion: '1.20240101.01.00',
  baseUrl: 'https://music.youtube.com/youtubei/v1',
};

const innertubeHeaders = {
  'Content-Type': 'application/json',
  'X-YouTube-Client-Name': '67',
  'X-YouTube-Client-Version': INNERTUBE_CONFIG.clientVersion,
  'X-Origin': 'https://music.youtube.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://music.youtube.com/',
  'Origin': 'https://music.youtube.com',
};

const innertubeBody = (extra = {}) => ({
  context: {
    client: {
      clientName: INNERTUBE_CONFIG.clientName,
      clientVersion: INNERTUBE_CONFIG.clientVersion,
      hl: 'en',
      gl: 'US',
    },
  },
  ...extra,
});

// --- Search Endpoint ---
// GET /api/search?q=<query>
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const response = await fetch(
      `${INNERTUBE_CONFIG.baseUrl}/search?key=${INNERTUBE_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: innertubeHeaders,
        body: JSON.stringify(innertubeBody({ query: q, params: 'EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D' })),
      }
    );

    if (!response.ok) throw new Error(`InnerTube search failed: ${response.status}`);
    const data = await response.json();

    // Parse the InnerTube response into clean tracks
    const tracks = parseSearchResults(data);
    res.json({ tracks });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

import youtubedl from 'youtube-dl-exec';

async function extractBestAudio(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const cookiesFile = await getCookiesFile();
  const options = {
    dumpJson: true,
    format: 'bestaudio',
    forceIpv4: true,
    geoBypass: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      'referer:youtube.com',
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    ]
  };

  if (cookiesFile) {
    options.cookies = cookiesFile;
  }

  const output = await youtubedl(url, options);

  if (!output || !output.url) {
    throw new Error('yt-dlp could not extract a stream URL');
  }

  return output;
}

// --- Stream URL Endpoint ---
// GET /api/stream/:videoId
// Uses yt-dlp to bypass YouTube's stream protections reliably
app.get('/api/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    const output = await extractBestAudio(videoId);

    console.log(`[stream] ✓ Success via yt-dlp -> ${output.acodec || 'audio'} @ ${output.abr || 'unknown'}kbps`);
    
    res.json({
      url: output.url,
      mimeType: `audio/${output.ext || 'webm'}`,
      bitrate: (output.abr || 128) * 1000,
      durationMs: (output.duration || 0) * 1000,
    });
  } catch (err) {
    console.error(`[stream] Error for ${videoId}:`, err.message);
    res.status(500).json({
      error: isYoutubeBotError(err)
        ? 'YouTube blocked this server. Add YTDLP_COOKIES_CONTENT in Render with cookies.txt content, then redeploy.'
        : err.message,
    });
  }
});

async function proxyAudio(req, res, asAttachment = false) {
  const { videoId } = req.params;

  try {
    const output = await extractBestAudio(videoId);
    const audioResponse = await fetch(output.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.youtube.com/',
      },
    });

    if (!audioResponse.ok || !audioResponse.body) {
      throw new Error(`Audio fetch failed: ${audioResponse.status}`);
    }

    const contentType = audioResponse.headers.get('content-type') || `audio/${output.ext || 'webm'}`;
    const contentLength = audioResponse.headers.get('content-length');
    const extension = output.ext || 'webm';
    const fileName = sanitizeFileName(req.query.filename || output.title || `audiosa-${videoId}`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-store');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (asAttachment) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${extension}"`);
    }

    audioResponse.body.pipe(res);
    audioResponse.body.on('error', (err) => {
      console.error(`[audio] Stream error for ${videoId}:`, err.message);
      if (!res.headersSent) res.status(500).json({ error: err.message });
      else res.destroy(err);
    });
  } catch (err) {
    console.error(`[audio] Error for ${videoId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: isYoutubeBotError(err)
          ? 'YouTube blocked this server. Add YTDLP_COOKIES_CONTENT in Render with cookies.txt content, then redeploy.'
          : err.message,
      });
    }
  }
}

// GET /api/audio/:videoId
// Streams audio through this proxy so the PWA can save it into IndexedDB.
app.get('/api/audio/:videoId', (req, res) => proxyAudio(req, res, false));

// GET /api/download/:videoId
// Browser-level file download for devices that expose a Downloads folder.
app.get('/api/download/:videoId', (req, res) => proxyAudio(req, res, true));


// --- Home/Trending Endpoint ---
// GET /api/home
app.get('/api/home', async (req, res) => {
  try {
    const response = await fetch(
      `${INNERTUBE_CONFIG.baseUrl}/browse?key=${INNERTUBE_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: innertubeHeaders,
        body: JSON.stringify(innertubeBody({ browseId: 'FEmusic_home' })),
      }
    );

    if (!response.ok) throw new Error(`Home browse failed: ${response.status}`);
    const data = await response.json();

    // Simplified: extract shelves/sections
    const sections = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const shelves = sections.map(section => {
      const shelf = section.musicCarouselShelfRenderer || section.musicImmersiveCarouselShelfRenderer;
      if (!shelf) return null;

      const title = shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || 'Music';
      const items = (shelf.contents || []).map(parseTrackItem).filter(Boolean);
      return { title, items };
    }).filter(Boolean);

    res.json({ shelves });
  } catch (err) {
    console.error('Home error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Lyrics via LRCLib ---
// GET /api/lyrics?track=<name>&artist=<artist>
app.get('/api/lyrics', async (req, res) => {
  const { track, artist, duration } = req.query;
  if (!track || !artist) return res.status(400).json({ error: 'track and artist required' });

  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}${duration ? `&duration=${duration}` : ''}`;
    const response = await fetch(url, { headers: { 'Lrclib-Client': 'Audiosa/1.0' } });

    if (!response.ok) return res.json({ syncedLyrics: null, plainLyrics: null });
    const data = await response.json();

    res.json({
      syncedLyrics: data.syncedLyrics || null,
      plainLyrics: data.plainLyrics || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Parser helpers ---
function parseSearchResults(data) {
  try {
    const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const tracks = [];
    for (const section of contents) {
      const items = section?.musicShelfRenderer?.contents || [];
      for (const item of items) {
        const track = parseTrackItem(item);
        if (track) tracks.push(track);
      }
    }
    return tracks;
  } catch {
    return [];
  }
}

function parseTrackItem(item) {
  try {
    const renderer = item?.musicTwoColumnItemRenderer || item?.musicResponsiveListItemRenderer;
    if (!renderer) return null;

    const runs = renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const name = runs?.[0]?.text;
    const videoId = runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId
      || renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

    if (!name || !videoId) return null;

    const artistRuns = renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const artist = parseArtistName(artistRuns);

    const thumbnail = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url;

    return { id: videoId, name, artist, thumbnail };
  } catch {
    return null;
  }
}

function parseArtistName(runs = []) {
  const text = runs
    .map((run) => run.text)
    .filter((value) => {
      const trimmed = value?.trim();
      return trimmed
        && trimmed !== '•'
        && !/^\d+:\d{2}$/.test(trimmed)
        && !/^\d{4}$/.test(trimmed)
        && !/^(Song|Video|Album|Single|EP)$/i.test(trimmed);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text || 'Unknown Artist';
}

app.listen(PORT, () => {
  console.log(`🎵 Audiosa proxy running on http://localhost:${PORT}`);
});
