import { useState, useEffect } from 'react';
import { getLyrics } from '../lib/innertube';
import { X, Loader2 } from 'lucide-react';

export default function LyricsModal({ track, onClose }) {
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!track) return;
    queueMicrotask(() => {
      setLoading(true);
      getLyrics(track.name, track.artist)
        .then(res => {
          if (res.syncedLyrics) setLyrics(res.syncedLyrics);
          else if (res.plainLyrics) setLyrics(res.plainLyrics);
          else setLyrics('No lyrics found for this track.');
        })
        .catch(() => setLyrics('Failed to load lyrics.'))
        .finally(() => setLoading(false));
    });
  }, [track]);

  if (!track) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">{track.name}</h3>
            <p className="text-sm text-white/50">{track.artist}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar whitespace-pre-wrap text-center text-lg font-medium leading-relaxed">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4 py-10">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Searching for lyrics...</p>
            </div>
          ) : (
            <div className="text-white/80 pb-10">
              {lyrics.split('\n').map((line, i) => {
                // Strip LRCLib timestamps like [00:12.34]
                const cleanLine = line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim();
                return <p key={i} className={`min-h-[1.5rem] ${cleanLine ? 'mb-2 hover:text-white transition-colors cursor-default' : ''}`}>{cleanLine}</p>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
