import { describe, it, expect } from 'vitest';
import { INITIAL_MEDIA, mergeMediaUpdate } from '../src/services/mediaState.js';

describe('INITIAL_MEDIA', () => {
  it('includes thumbnailKey as null', () => {
    expect(INITIAL_MEDIA.thumbnailKey).toBeNull();
    expect(INITIAL_MEDIA.hasMedia).toBe(false);
  });
});

describe('mergeMediaUpdate', () => {
  const basePlaying = {
    hasMedia: true,
    title: 'Song A',
    artist: 'Artist A',
    isPlaying: true,
    position: 10,
    duration: 200,
    thumbnail: 'data:image/jpeg;base64,AAA',
    thumbnailKey: 'Song A|Artist A',
  };

  it('bails out with identical prev reference when no media and already idle', () => {
    const next = mergeMediaUpdate(INITIAL_MEDIA, { hasMedia: false });
    expect(next).toBe(INITIAL_MEDIA);
  });

  it('clears hasMedia and isPlaying when media stops while preserving metadata', () => {
    const next = mergeMediaUpdate(basePlaying, { hasMedia: false });
    expect(next).not.toBe(basePlaying);
    expect(next.hasMedia).toBe(false);
    expect(next.isPlaying).toBe(false);
    expect(next.title).toBe('Song A');
  });

  it('returns identical prev reference when no material change and position diff <= 1.5s', () => {
    const next = mergeMediaUpdate(basePlaying, {
      hasMedia: true,
      title: 'Song A',
      artist: 'Artist A',
      isPlaying: true,
      position: 11.2,
      duration: 200,
      thumbnail: null,
    });
    expect(next).toBe(basePlaying);
  });

  it('updates position when diff exceeds 1.5s on same track', () => {
    const next = mergeMediaUpdate(basePlaying, {
      hasMedia: true,
      title: 'Song A',
      artist: 'Artist A',
      isPlaying: true,
      position: 12.0,
      duration: 200,
      thumbnail: null,
    });
    expect(next).not.toBe(basePlaying);
    expect(next.position).toBe(12.0);
  });

  it('does not smooth position across track change', () => {
    const next = mergeMediaUpdate(basePlaying, {
      hasMedia: true,
      title: 'Song B',
      artist: 'Artist B',
      isPlaying: true,
      position: 10.5,
      duration: 180,
      thumbnail: null,
    });
    expect(next.position).toBe(10.5);
    expect(next.thumbnail).toBe('data:image/jpeg;base64,AAA');
    expect(next.thumbnailKey).toBe('Song A|Artist A');
  });

  it('updates thumbnail and thumbnailKey when new thumbnail arrives', () => {
    const next = mergeMediaUpdate(basePlaying, {
      hasMedia: true,
      title: 'Song B',
      artist: 'Artist B',
      isPlaying: true,
      position: 1,
      duration: 180,
      thumbnail: 'data:image/jpeg;base64,BBB',
    });
    expect(next.thumbnail).toBe('data:image/jpeg;base64,BBB');
    expect(next.thumbnailKey).toBe('Song B|Artist B');
  });

  it('returns new object when isPlaying or duration changes', () => {
    const paused = mergeMediaUpdate(basePlaying, {
      hasMedia: true,
      title: 'Song A',
      artist: 'Artist A',
      isPlaying: false,
      position: 10,
      duration: 200,
      thumbnail: null,
    });
    expect(paused).not.toBe(basePlaying);
    expect(paused.isPlaying).toBe(false);
  });
});
