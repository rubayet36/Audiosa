import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, Music, Play, Send, Trash2, Users } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import {
  browserDownloadUrl,
  createDownloadedTrackUrl,
  getDownloadedTracks,
  removeDownloadedTrack,
} from '../lib/downloads';
import {
  getLocalShareCode,
  getPartnerCode,
  getPartnerSharedTracks,
  savePartnerCode,
  shareTrackWithPartner,
} from '../lib/supabase';

function formatSize(bytes = 0) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

function TrackRow({ track, meta, onPlay, onDelete, onShare, canDownload, isSharing }) {
  return (
    <button
      onClick={() => onPlay(track)}
      className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/6"
    >
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
        {track.thumbnail
          ? <img src={track.thumbnail} alt={track.name} className="h-full w-full object-cover" />
          : <div className="grid h-full w-full place-items-center"><Music className="h-5 w-5 text-white/30" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{track.name}</p>
        <p className="truncate text-sm text-white/45">{meta || track.artist}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {canDownload && (
          <a
            href={browserDownloadUrl(track)}
            onClick={(event) => event.stopPropagation()}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white hover:text-black"
            title="Save file to device"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        {onShare && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onShare(track);
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white hover:text-black"
            title="Share with partner"
          >
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </span>
        )}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white">
          <Play className="h-4 w-4" fill="currentColor" />
        </span>
        {onDelete && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(track);
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/50 hover:bg-red-500/20 hover:text-red-200"
            title="Remove download"
          >
            <Trash2 className="h-4 w-4" />
          </span>
        )}
      </div>
    </button>
  );
}

export default function Library() {
  const [activeTab, setActiveTab] = useState('downloads');
  const [downloads, setDownloads] = useState([]);
  const [partnerTracks, setPartnerTracks] = useState([]);
  const [partnerCode, setPartnerCode] = useState(() => getPartnerCode());
  const [shareCode] = useState(() => getLocalShareCode());
  const [sharingId, setSharingId] = useState(null);
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const recentTracks = usePlayerStore((state) => state.recentTracks);
  const setTrack = usePlayerStore((state) => state.setTrack);

  const refreshDownloads = useCallback(async () => {
    try {
      setDownloads(await getDownloadedTracks());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refreshPartnerTracks = useCallback(async () => {
    setLoadingPartner(true);
    try {
      setPartnerTracks(await getPartnerSharedTracks(shareCode));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPartner(false);
    }
  }, [shareCode]);

  useEffect(() => {
    queueMicrotask(refreshDownloads);
    queueMicrotask(refreshPartnerTracks);
  }, [refreshDownloads, refreshPartnerTracks]);

  const playDownload = (track) => {
    const streamUrl = createDownloadedTrackUrl(track);
    if (!streamUrl) return;
    setTrack({ ...track, streamUrl, isDownloaded: true });
  };

  const deleteDownload = async (track) => {
    await removeDownloadedTrack(track.id);
    refreshDownloads();
  };

  const savePartner = () => {
    savePartnerCode(partnerCode);
    setMessage('Partner code saved.');
    setTimeout(() => setMessage(''), 2000);
  };

  const shareTrack = async (track) => {
    setSharingId(track.id);
    setError(null);
    setMessage('');
    try {
      await shareTrackWithPartner(track, partnerCode, shareCode);
      setMessage('Song shared with partner.');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSharingId(null);
    }
  };

  const tabs = [
    { id: 'downloads', label: 'Downloads' },
    { id: 'recent', label: 'Recent' },
    { id: 'partner', label: 'Partner' },
  ];

  const tracks = activeTab === 'downloads'
    ? downloads
    : activeTab === 'recent'
      ? recentTracks
      : partnerTracks;

  const playTrack = (track) => {
    if (activeTab === 'downloads') playDownload(track);
    else setTrack(track);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Your Library</h2>
          <p className="mt-1 text-sm text-white/45">Downloads, recent plays, and partner shares in one place.</p>
        </div>
        <div className="grid grid-cols-3 rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-2 transition-colors sm:px-4 ${activeTab === tab.id ? 'bg-white text-black' : 'text-white/60'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {(error || message) && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-green-500/20 bg-green-500/10 text-green-200'}`}>
          {error || message}
        </div>
      )}

      {activeTab === 'partner' && (
        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="glass rounded-3xl p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-black">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Partner sharing</h3>
                <p className="text-sm text-white/45">Give your code to your partner.</p>
              </div>
            </div>
            <div className="rounded-2xl bg-black/25 p-4 font-mono text-lg font-bold text-white">{shareCode}</div>
          </div>
          <div className="glass rounded-3xl p-5">
            <label className="mb-2 block text-sm font-semibold text-white/70" htmlFor="partner-code">Partner code</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="partner-code"
                value={partnerCode}
                onChange={(event) => setPartnerCode(event.target.value.toUpperCase())}
                placeholder="AUD-ABCD-EFGH"
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none focus:border-white/25"
              />
              <button onClick={savePartner} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black">
                Save
              </button>
              <button onClick={refreshPartnerTracks} className="rounded-2xl bg-white/8 px-5 py-3 text-sm font-bold text-white">
                Refresh
              </button>
            </div>
          </div>
        </section>
      )}

      {loadingPartner && activeTab === 'partner' ? (
        <div className="grid place-items-center py-16 text-white/45">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          Loading partner songs...
        </div>
      ) : tracks.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-white/50">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white/5">
            {activeTab === 'partner'
              ? <Users className="h-8 w-8 text-white/25" />
              : activeTab === 'downloads'
                ? <Download className="h-8 w-8 text-white/25" />
                : <Music className="h-8 w-8 text-white/25" />}
          </div>
          {activeTab === 'partner'
            ? 'Songs your partner shares with your code will appear here.'
            : activeTab === 'downloads'
              ? 'Downloaded music will appear here after you tap the download icon on a song.'
              : 'Recently played music will appear here.'}
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <TrackRow
              key={`${track.id}-${track.sharedAt || ''}`}
              track={track}
              meta={
                activeTab === 'downloads' && track.size
                  ? `${track.artist} · ${formatSize(track.size)}`
                  : activeTab === 'partner'
                    ? `${track.artist} · from ${track.sharedBy}`
                    : track.artist
              }
              onPlay={playTrack}
              onDelete={activeTab === 'downloads' ? deleteDownload : null}
              onShare={activeTab !== 'partner' ? shareTrack : null}
              canDownload={activeTab === 'downloads'}
              isSharing={sharingId === track.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
