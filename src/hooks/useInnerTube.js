import { useState, useCallback } from 'react';
import { searchTracks, getStreamUrl } from '../lib/innertube';
import usePlayerStore from '../store/playerStore';

export default function useInnerTube() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setQueue, setTrack } = usePlayerStore();

  const search = useCallback(async (query) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const tracks = await searchTracks(query);
      setResults(tracks);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Play a track — fetches the stream URL then sets in player
   */
  const playTrack = useCallback(async (track) => {
    setIsLoading(true);
    try {
      const { url } = await getStreamUrl(track.id);
      const enriched = { ...track, streamUrl: url };
      setTrack(enriched);
    } catch (err) {
      setError(`Could not load stream: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [setTrack]);

  /**
   * Play a list of tracks starting from a given index
   */
  const playAll = useCallback(async (tracks, startIndex = 0) => {
    setIsLoading(true);
    try {
      const { url } = await getStreamUrl(tracks[startIndex].id);
      const enriched = tracks.map((t, i) =>
        i === startIndex ? { ...t, streamUrl: url } : t
      );
      setQueue(enriched, startIndex);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setQueue]);

  return { results, isLoading, error, search, playTrack, playAll };
}
