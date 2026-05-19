import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Music, Play, Search, Sparkles } from 'lucide-react';
import { downloadTrackToLibrary } from '../lib/downloads';
import { searchTracks } from '../lib/innertube';
import useInnerTube from '../hooks/useInnerTube';

const genres = [
  { name: 'Pop', query: 'top pop hits', color: 'from-pink-500 to-rose-700' },
  { name: 'Hip-Hop', query: 'hip hop bangers', color: 'from-orange-400 to-red-700' },
  { name: 'Electronic', query: 'electronic dance music', color: 'from-cyan-400 to-blue-700' },
  { name: 'Rock', query: 'rock essentials', color: 'from-zinc-300 to-zinc-700' },
  { name: 'Bangla', query: 'bangla new song', color: 'from-emerald-400 to-teal-800' },
  { name: 'Lo-Fi', query: 'lofi chill beats', color: 'from-violet-400 to-indigo-800' },
  { name: 'R&B', query: 'rnb slow jams', color: 'from-fuchsia-500 to-purple-800' },
  { name: 'Workout', query: 'workout motivation music', color: 'from-lime-400 to-green-800' },
];

const madeForYou = [
  { title: 'Today\'s Top Mix', query: 'today top hits' },
  { title: 'Late Night Drive', query: 'late night drive songs' },
  { title: 'Desi Heat', query: 'desi party songs' },
];

export default function Browse() {
  const [activeGenre, setActiveGenre] = useState(genres[0]);
  const [genreTracks, setGenreTracks] = useState([]);
  const [mixes, setMixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const { playTrack } = useInnerTube();

  const heroTrack = useMemo(() => genreTracks[0], [genreTracks]);

  useEffect(() => {
    let cancelled = false;

    async function loadBrowse() {
      setLoading(true);
      setError(null);
      try {
        const [genreResults, ...mixResults] = await Promise.all([
          searchTracks(activeGenre.query),
          ...madeForYou.map((mix) => searchTracks(mix.query)),
        ]);

        if (cancelled) return;
        setGenreTracks(genreResults);
        setMixes(madeForYou.map((mix, index) => ({
          ...mix,
          tracks: mixResults[index].slice(0, 6),
        })));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBrowse();
    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

  const handleDownload = async (event, track) => {
    event.stopPropagation();
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

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/55">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Browse
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Find your next repeat</h2>
          <p className="mt-1 text-sm text-white/45">Genre stations, fresh mixes, and quick downloads.</p>
        </div>
        <div className="relative max-w-md flex-1 lg:flex-none">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/35 outline-none focus:border-white/25"
            placeholder="Pick a genre below or search in Search"
            readOnly
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {genres.map((genre) => (
          <button
            key={genre.name}
            onClick={() => setActiveGenre(genre)}
            className={`relative min-h-24 overflow-hidden rounded-2xl bg-gradient-to-br ${genre.color} p-4 text-left font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 ${activeGenre.name === genre.name ? 'ring-2 ring-white' : ''}`}
          >
            <span className="relative z-10">{genre.name}</span>
            <Music className="absolute -bottom-3 -right-2 h-14 w-14 rotate-12 text-white/25" />
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {heroTrack && (
        <section className="mb-9 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="flex flex-col sm:flex-row">
            <div className="h-56 sm:h-auto sm:w-64 flex-shrink-0 bg-white/5">
              {heroTrack.thumbnail
                ? <img src={heroTrack.thumbnail} alt={heroTrack.name} className="h-full w-full object-cover" />
                : <div className="grid h-full place-items-center"><Music className="h-12 w-12 text-white/20" /></div>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-end p-5 sm:p-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">{activeGenre.name} radio</p>
              <h3 className="truncate text-3xl font-black text-white sm:text-5xl">{heroTrack.name}</h3>
              <p className="mt-2 truncate text-white/55">{heroTrack.artist}</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => playTrack(heroTrack)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  Play
                </button>
                <button
                  onClick={(event) => handleDownload(event, heroTrack)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/8 px-5 py-3 text-sm font-bold text-white"
                >
                  {downloadingId === heroTrack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid place-items-center py-20 text-white/45">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          Loading Browse...
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h3 className="mb-4 text-xl font-bold text-white">{activeGenre.name} essentials</h3>
            <div className="space-y-2">
              {genreTracks.slice(0, 10).map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/6"
                >
                  <span className="w-6 text-center text-sm text-white/35">{index + 1}</span>
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/5">
                    {track.thumbnail && <img src={track.thumbnail} alt={track.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{track.name}</p>
                    <p className="truncate text-sm text-white/45">{track.artist}</p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => handleDownload(event, track)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/55 hover:bg-white hover:text-black"
                    title="Save to Downloads"
                  >
                    {downloadingId === track.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-white">Made for Audiosa</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {mixes.map((mix) => (
                <div key={mix.title} className="glass rounded-3xl p-4">
                  <h4 className="mb-3 font-bold text-white">{mix.title}</h4>
                  <div className="flex -space-x-3">
                    {mix.tracks.slice(0, 4).map((track) => (
                      <button
                        key={track.id}
                        onClick={() => playTrack(track)}
                        className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#09090b] bg-white/5"
                        title={track.name}
                      >
                        {track.thumbnail && <img src={track.thumbnail} alt={track.name} className="h-full w-full object-cover" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-white/45">{mix.tracks.length} tracks ready to play</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
