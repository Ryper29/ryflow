import { describe, it, expect } from 'vitest';
import { createLyricsCache } from '../src/services/lyricsCache.js';

describe('createLyricsCache', () => {
  it('stores and retrieves synced lyrics', () => {
    const cache = createLyricsCache();
    const entry = { status: 'synced', lyrics: [{ time: 1.5, text: 'Line 1' }] };
    cache.set('Song A___Artist A', entry);
    expect(cache.get('Song A___Artist A')).toEqual(entry);
  });

  it('stores and retrieves plain lyrics', () => {
    const cache = createLyricsCache();
    const entry = { status: 'plain', lyrics: [{ text: 'Plain line' }] };
    cache.set('Song B___Artist B', entry);
    expect(cache.get('Song B___Artist B')).toEqual(entry);
  });

  it('ignores not_found entries and returns undefined on get', () => {
    const cache = createLyricsCache();
    cache.set('Missing___Artist', { status: 'not_found', lyrics: [] });
    expect(cache.get('Missing___Artist')).toBeUndefined();
  });

  it('evicts the oldest entry when exceeding maxEntries', () => {
    const cache = createLyricsCache(2);
    cache.set('k1', { status: 'synced', lyrics: [{ time: 0, text: '1' }] });
    cache.set('k2', { status: 'synced', lyrics: [{ time: 0, text: '2' }] });
    cache.set('k3', { status: 'synced', lyrics: [{ time: 0, text: '3' }] });

    expect(cache.get('k1')).toBeUndefined();
    expect(cache.get('k2')).toEqual({ status: 'synced', lyrics: [{ time: 0, text: '2' }] });
    expect(cache.get('k3')).toEqual({ status: 'synced', lyrics: [{ time: 0, text: '3' }] });
  });

  it('refreshes entry recency on get before eviction', () => {
    const cache = createLyricsCache(2);
    cache.set('k1', { status: 'plain', lyrics: [{ text: '1' }] });
    cache.set('k2', { status: 'plain', lyrics: [{ text: '2' }] });
    expect(cache.get('k1')).toBeDefined();
    cache.set('k3', { status: 'plain', lyrics: [{ text: '3' }] });

    expect(cache.get('k2')).toBeUndefined();
    expect(cache.get('k1')).toEqual({ status: 'plain', lyrics: [{ text: '1' }] });
    expect(cache.get('k3')).toEqual({ status: 'plain', lyrics: [{ text: '3' }] });
  });
});
