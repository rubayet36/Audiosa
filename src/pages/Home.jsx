import { useEffect, useState } from 'react';
import { DownloadCloud, Loader2, Music, Sparkles } from 'lucide-react';
import TrackCard from '../components/TrackCard';
import useInnerTube from '../hooks/useInnerTube';
import usePlayerStore from '../store/playerStore';
import { downloadTrackToLibrary } from '../lib/downloads';
import { getRecommendations } from '../lib/groq';
import { getHomeShelves, searchTracks } from '../lib/innertube';

export default function Home() {
  const [shelves, setShelves] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const { playTrack } = useInnerTube();
  const recentTracks = usePlayerStore((state) => state.recentTracks);

  useEffect(() => {
    getHomeShelves()
      .then((data) => setShelves(data.shelves || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      try {
        const data = await getRecommendations(recentTracks);
        const tracks = [];

        for (const item of (data.queries || []).slice(0, 5)) {
          const matches = await searchTracks(item.query);
          const firstMatch = matches[0];
          if (firstMatch && !tracks.some((track) => track.id === firstMatch.id)) {
            tracks.push({ ...firstMatch, reason: item.reason || item.genre });
          }
        }

        if (!cancelled) setRecommendations(tracks);
      } catch (err) {
        console.error('Recommendation load failed:', err);
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [recentTracks]);

  const handleDownload = async (track) => {
    setDownloadingId(track.id);
    setError(null);
    try {
      await downloadTrackToLibrary(track);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-white/50 text-sm">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(20,184,166,0.12),rgba(255,255,255,0.04))] p-5 sm:p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          Personal music hub
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">Audiosa</h2>
        <p className="text-white/60 mt-2 max-w-2xl">
          Stream tracks, save songs to your phone's app storage, and play them from your Downloads playlist.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error.includes('Jamendo')
            ? 'Could not connect to Jamendo. Check your Jamendo client ID and try again.'
            : error}
        </div>
      )}

      {recommendations.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Recommended for you</h3>
              <p className="text-sm text-white/45">Updated from what you recently played</p>
            </div>
            <DownloadCloud className="h-5 w-5 text-white/30" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {recommendations.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onPlay={() => playTrack(track)}
                onDownload={handleDownload}
                isDownloading={downloadingId === track.id}
              />
            ))}
          </div>
        </section>
      )}

      {shelves.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Music className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No Jamendo tracks found yet. Try Search or Browse.</p>
        </div>
      )}

      {shelves.map((shelf, shelfIndex) => (
        <section key={`${shelf.title}-${shelfIndex}`} className="mb-10">
          <h3 className="text-xl font-semibold text-white mb-4">{shelf.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {shelf.items.slice(0, 10).map((track, trackIndex) => (
              <TrackCard
                key={track.id || trackIndex}
                track={track}
                onPlay={() => playTrack(track)}
                onDownload={handleDownload}
                isDownloading={downloadingId === track.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
