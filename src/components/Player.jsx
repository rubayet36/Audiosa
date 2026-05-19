import { useState, useCallback } from 'react';
import usePlayerStore from '../store/playerStore';
import usePlayer from '../hooks/usePlayer';
import LyricsModal from './LyricsModal';
import { downloadTrackToLibrary } from '../lib/downloads';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat,
  Heart, Download, Share2, Loader2, Text
} from 'lucide-react';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const {
    currentTrack, isPlaying, isLoading,
    duration, currentTime, volume, isMuted,
    togglePlay, setVolume, toggleMute,
  } = usePlayerStore();
  const { seek } = usePlayer();
  const [liked, setLiked] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [downloadState, setDownloadState] = useState('idle');

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  }, [duration, seek]);

  const handleVolumeChange = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(ratio);
  }, [setVolume]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDownload = useCallback(async () => {
    if (!currentTrack) return;
    setDownloadState('loading');
    try {
      await downloadTrackToLibrary(currentTrack);
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 1500);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadState('idle');
    }
  }, [currentTrack]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 md:h-24 glass-panel z-50">
      {/* Progress bar (full width, top) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-pointer group"
        onClick={handleSeek}
      >
        <div className="h-full bg-white/10 group-hover:bg-white/20 transition-colors">
          <div
            className="h-full bg-primary relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      <div className="flex items-center h-full px-3 sm:px-6 pt-1">
        {/* Track Info */}
        <div className="w-[44%] md:w-1/3 flex items-center min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg mr-3 flex-shrink-0 overflow-hidden bg-white/5">
            {currentTrack?.thumbnail
              ? <img src={currentTrack.thumbnail} alt={currentTrack.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-purple-700/40 to-blue-700/40" />
            }
          </div>
          <div className="min-w-0 mr-3">
            <h4 className="font-semibold text-white text-sm truncate">
              {currentTrack?.name || 'Nothing playing'}
            </h4>
            <p className="text-xs text-white/50 truncate">
              {currentTrack?.artist || '—'}
            </p>
          </div>
          <button
            onClick={() => setLiked(l => !l)}
            className={`hidden sm:block flex-shrink-0 transition-colors ${liked ? 'text-red-400' : 'text-white/30 hover:text-white/60'}`}
            title="Like"
          >
            <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDownload}
            disabled={!currentTrack || downloadState === 'loading'}
            className={`sm:hidden flex-shrink-0 transition-colors disabled:opacity-40 ${downloadState === 'done' ? 'text-green-300' : 'text-white/40 hover:text-white'}`}
            title="Save to Downloads"
          >
            {downloadState === 'loading'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
          </button>
        </div>

        {/* Centre Controls */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center space-x-5 mb-1">
            <button className="hidden sm:block text-white/30 hover:text-white transition-colors" title="Shuffle">
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={() => usePlayerStore.getState().playPrev()}
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isPlaying
                  ? <Pause className="w-4 h-4" fill="currentColor" />
                  : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              }
            </button>

            <button
              onClick={() => usePlayerStore.getState().playNext()}
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button className="hidden sm:block text-white/30 hover:text-white transition-colors" title="Repeat">
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 w-full max-w-sm">
            <span className="text-xs text-white/40 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div
              className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
              onClick={handleSeek}
            >
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-white/40 w-8 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="hidden md:flex w-1/3 items-center justify-end space-x-4">
          <button 
            onClick={() => setShowLyrics(true)}
            disabled={!currentTrack}
            className={`transition-colors ${showLyrics ? 'text-primary' : 'text-white/30 hover:text-white'} disabled:opacity-50`}
            title="Lyrics"
          >
            <Text className="w-4 h-4" />
          </button>
          <button className="text-white/30 hover:text-white transition-colors" title="Share">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!currentTrack || downloadState === 'loading'}
            className={`transition-colors disabled:opacity-40 ${downloadState === 'done' ? 'text-green-300' : 'text-white/30 hover:text-white'}`}
            title="Save to Downloads"
          >
            {downloadState === 'loading'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
          </button>
          <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
            {isMuted || volume === 0
              ? <VolumeX className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />}
          </button>
          <div
            className="w-24 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
            onClick={handleVolumeChange}
          >
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            />
          </div>
        </div>
      </div>

      {showLyrics && (
        <LyricsModal track={currentTrack} onClose={() => setShowLyrics(false)} />
      )}
    </div>
  );
}
