export interface PlaylistLoadGuard {
  begin(playlist: string, onBegin: (playlist: string) => void): number;
  finish(seq: number): void;
  isActive(seq: number): boolean;
  isLoading(): boolean;
}

export function createPlaylistLoadGuard(): PlaylistLoadGuard {
  let playlistLoadSeq = 0;
  let activePlaylistLoadSeq = 0;

  return {
    begin(playlist: string, onBegin: (playlist: string) => void): number {
      const nextSeq = ++playlistLoadSeq;
      activePlaylistLoadSeq = nextSeq;
      onBegin(playlist);
      return nextSeq;
    },
    finish(seq: number): void {
      if (activePlaylistLoadSeq === seq) {
        activePlaylistLoadSeq = 0;
      }
    },
    isActive(seq: number): boolean {
      return activePlaylistLoadSeq === seq;
    },
    isLoading(): boolean {
      return activePlaylistLoadSeq !== 0;
    },
  };
}
