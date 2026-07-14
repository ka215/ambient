export interface CreatePlayerStateSupportOptions {
  playerRef: {
    current: YTPlayer | undefined;
  };
}

export interface PlayerStateSupport {
  getPlayer(): unknown;
  setPlayer(player: YTPlayer): void;
}

export function createPlayerStateSupport(
  options: CreatePlayerStateSupportOptions
): PlayerStateSupport {
  return {
    getPlayer: () => options.playerRef.current,
    setPlayer: (player) => {
      options.playerRef.current = player;
    },
  };
}
