import { Download, Music, Play } from 'lucide-react';

export default function TrackCard({ track, onPlay, onDownload, isDownloading = false }) {
  return (
    <button
      onClick={onPlay}
      className="glass p-3 rounded-2xl hover:bg-white/8 hover:-translate-y-0.5 transition-all group cursor-pointer text-left w-full shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-white/5">
        {track?.thumbnail
          ? <img
              src={track.thumbnail}
              alt={track.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          : <div className="absolute inset-0 bg-gradient-to-br from-purple-700/30 to-blue-700/30 flex items-center justify-center">
              <Music className="w-8 h-8 text-white/20" />
            </div>
        }

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {onDownload && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              if (track?.downloadAllowed === false) return;
              onDownload(track);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                if (track?.downloadAllowed === false) return;
                onDownload(track);
              }
            }}
            className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${
              track?.downloadAllowed === false
                ? 'text-white/25'
                : 'text-white/80 hover:bg-white hover:text-black'
            }`}
            title={track?.downloadAllowed === false ? 'Download disabled by artist' : 'Save to Downloads'}
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-pulse' : ''}`} />
          </span>
        )}
      </div>

      <p className="font-semibold text-white text-sm truncate">{track?.name || 'Track Title'}</p>
      <p className="text-xs text-white/50 truncate mt-0.5">{track?.artist || 'Artist'}</p>
    </button>
  );
}
