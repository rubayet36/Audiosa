import { useState, useCallback, useRef } from 'react';
import { Download, Loader2, Music, Search as SearchIcon } from 'lucide-react';
import useInnerTube from '../hooks/useInnerTube';
import { downloadTrackToLibrary } from '../lib/downloads';

export default function Search() {
  const [query, setQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const { results, isLoading, error, search, playTrack } = useInnerTube();
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) return;
    debounceRef.current = setTimeout(() => search(val), 500);
  }, [search]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (query.trim()) search(query.trim());
  }, [query, search]);

  const handleDownload = useCallback(async (event, track) => {
    event.stopPropagation();
    setDownloadingId(track.id);
    setDownloadError(null);
    try {
      await downloadTrackToLibrary(track);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-full">
      <h2 className="text-3xl font-bold mb-6 text-white tracking-tight">Search</h2>

      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading
            ? <Loader2 className="h-5 w-5 text-primary animate-spin" />
            : <SearchIcon className="h-5 w-5 text-white/40" />
          }
        </div>
        <input
          id="search-input"
          type="text"
          autoFocus
          className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/8 transition-all text-base"
          placeholder="Search songs, artists, albums…"
          value={query}
          onChange={handleChange}
        />
      </form>

      {(error || downloadError) && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error || downloadError}
        </div>
      )}

      {results.length > 0 ? (
        <div>
          <p className="text-sm text-white/40 mb-4">{results.length} results for "{query}"</p>
          <div className="space-y-1">
            {results.map((track, i) => (
              <button
                key={track.id || i}
                onClick={() => playTrack(track)}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group text-left"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  {track.thumbnail
                    ? <img src={track.thumbnail} alt={track.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-white/30" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate group-hover:text-primary transition-colors">{track.name}</p>
                  <p className="text-sm text-white/50 truncate">{track.artist}</p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => handleDownload(event, track)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') handleDownload(event, track);
                  }}
                  title="Save to Downloads"
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white hover:text-black"
                >
                  {downloadingId === track.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        !isLoading && query.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <SearchIcon className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-xl font-semibold text-white/60 mb-2">Find your music</h3>
            <p className="text-white/30 text-sm">Search for any song, artist, or album</p>
          </div>
        )
      )}
    </div>
  );
}
