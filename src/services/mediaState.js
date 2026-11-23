export const INITIAL_MEDIA = {
  hasMedia: false,
  title: 'Belum ada musik',
  artist: 'Putar lagu di Spotify / Browser',
  isPlaying: false,
  position: 0,
  duration: 1,
  thumbnail: null,
  thumbnailKey: null,
};

export function mergeMediaUpdate(prev, data) {
  if (!data?.hasMedia) {
    if (!prev.hasMedia && !prev.isPlaying) return prev;
    return {
      ...prev,
      hasMedia: false,
      isPlaying: false,
    };
  }

  const key = `${data.title}|${data.artist}`;
  const sameTrack = prev.title === data.title && prev.artist === data.artist;
  const diff = Math.abs(prev.position - data.position);
  const position = sameTrack && diff <= 1.5 ? prev.position : data.position;
  const thumbnail = data.thumbnail ?? prev.thumbnail;
  const thumbnailKey = data.thumbnail ? key : prev.thumbnailKey;

  if (
    prev.hasMedia &&
    sameTrack &&
    prev.isPlaying === data.isPlaying &&
    prev.duration === data.duration &&
    prev.position === position &&
    prev.thumbnail === thumbnail &&
    prev.thumbnailKey === thumbnailKey
  ) {
    return prev;
  }

  return {
    ...data,
    thumbnail,
    thumbnailKey,
    position,
  };
}
