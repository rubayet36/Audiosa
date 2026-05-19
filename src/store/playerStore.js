import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  // Current track
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  recentTracks: JSON.parse(localStorage.getItem('audiosa_recent_tracks') || '[]'),

  // Player state
  isPlaying: false,
  isLoading: false,
  duration: 0,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,

  // Actions
  addRecentTrack: (track) => {
    if (!track?.id) return;
    const recentTracks = [
      {
        id: track.id,
        name: track.name,
        artist: track.artist,
        thumbnail: track.thumbnail,
        track_name: track.name,
        artist_name: track.artist,
      },
      ...get().recentTracks.filter((item) => item.id !== track.id),
    ].slice(0, 20);

    localStorage.setItem('audiosa_recent_tracks', JSON.stringify(recentTracks));
    set({ recentTracks });
  },

  setTrack: (track) => {
    get().addRecentTrack(track);
    set({ currentTrack: track, isPlaying: true });
  },

  setQueue: (tracks, startIndex = 0) => {
    const currentTrack = tracks[startIndex];
    get().addRecentTrack(currentTrack);
    set({ queue: tracks, queueIndex: startIndex, currentTrack, isPlaying: true });
  },

  playNext: () => {
    const { queue, queueIndex } = get();
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      get().addRecentTrack(queue[nextIndex]);
      set({ queueIndex: nextIndex, currentTrack: queue[nextIndex], isPlaying: true });
    }
  },

  playPrev: () => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      get().addRecentTrack(queue[prevIndex]);
      set({ queueIndex: prevIndex, currentTrack: queue[prevIndex], isPlaying: true });
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setLoading: (isLoading) => set({ isLoading }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),
}));

export default usePlayerStore;
