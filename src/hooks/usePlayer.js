import { useRef, useEffect } from 'react';
import usePlayerStore from '../store/playerStore';
import { getStreamUrl } from '../lib/innertube';

export default function usePlayer() {
  const audioRef = useRef(new Audio());

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    setPlaying,
    setLoading,
    setDuration,
    setCurrentTime,
    playNext,
  } = usePlayerStore();

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    let cancelled = false;

    if (!currentTrack?.id && !currentTrack?.streamUrl) return;

    async function loadAndPlay() {
      setLoading(true);
      try {
        const streamUrl = currentTrack.streamUrl || (await getStreamUrl(currentTrack.id)).url;
        if (cancelled) return;

        audio.src = streamUrl;
        audio.load();
        await audio.play();
        setPlaying(true);
      } catch (err) {
        console.error('Playback error:', err);
        setPlaying(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAndPlay();

    return () => {
      cancelled = true;
    };
  }, [currentTrack, setLoading, setPlaying]);

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio.src) return;
    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Volume control
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => playNext();
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [playNext, setCurrentTime, setDuration, setLoading]);

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return { audioRef, seek };
}
