import { useState, useEffect, useRef } from 'react';
import {
  parseLrc,
  queryLrcLib,
  parseYouTubeTitle,
  cleanTrackTitle,
  cleanChannelArtist,
} from '../services/lyrics.js';
import { INITIAL_MEDIA, mergeMediaUpdate } from '../services/mediaState.js';

const STALE_COVER_MS = 2000;
const FETCH_DEBOUNCE_MS = 400;
const COVER_FALLBACK_DELAY_MS = 2200;

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });

export function useMedia() {
  const [media, setMedia] = useState(INITIAL_MEDIA);
  const [lyrics, setLyrics] = useState([]);
  const [lyricStatus, setLyricStatus] = useState('idle');
  const [fallbackCover, setFallbackCover] = useState(null);
  const lastFetchedTrack = useRef('');
  const hasOwnCoverRef = useRef(false);
  const lyricsCacheRef = useRef(new Map());

  // Subscribe to Electron media updates
  useEffect(() => {
    if (!window.electronAPI?.onMediaUpdate) return;
    const unsubscribe = window.electronAPI.onMediaUpdate((data) => {
      setMedia((prev) => mergeMediaUpdate(prev, data));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Lacak apakah thumbnail saat ini milik lagu aktif
  useEffect(() => {
    hasOwnCoverRef.current = media.thumbnailKey === `${media.title}|${media.artist}`;
  }, [media.title, media.artist, media.thumbnailKey]);

  // Tahan cover lama maksimal 2 detik sebelum beralih ke fallback / placeholder
  useEffect(() => {
    const key = `${media.title}|${media.artist}`;
    if (!media.thumbnail || media.thumbnailKey === key) return;
    const t = setTimeout(() => {
      setMedia((prev) =>
        `${prev.title}|${prev.artist}` === key && prev.thumbnailKey !== key
          ? { ...prev, thumbnail: null, thumbnailKey: null }
          : prev
      );
    }, STALE_COVER_MS);
    return () => clearTimeout(t);
  }, [media.title, media.artist, media.thumbnail, media.thumbnailKey]);

  // Position interpolation when playing
  useEffect(() => {
    if (!media.isPlaying) return;
    const timer = setInterval(() => {
      setMedia((prev) => ({
        ...prev,
        position: Math.min(prev.duration, +(prev.position + 0.3).toFixed(2)),
      }));
    }, 300);
    return () => clearInterval(timer);
  }, [media.isPlaying]);

  // Fetch lyrics and cover art when track changes (debounce, paralel, iTunes hanya jika perlu)
  useEffect(() => {
    if (!media.hasMedia || !media.title || media.title === 'Tidak ada judul' || media.title === 'Belum ada musik') {
      return;
    }

    const trackKey = `${media.title}___${media.artist}`;
    if (trackKey === lastFetchedTrack.current) return;

    const controller = new AbortController();
    const { signal } = controller;
    let started = false;
    let finished = false;

    const parsedYT = parseYouTubeTitle(media.title, media.artist);
    const cleanTitle = cleanTrackTitle(media.title);
    const primaryArtist = media.artist.split(',')[0].split('&')[0].trim();
    const searchTitle = parsedYT.title || cleanTitle;
    const searchArtist = parsedYT.artist || primaryArtist;
    const hints = [
      primaryArtist,
      media.artist,
      ...(parsedYT.isYouTubeLike ? [parsedYT.artist, cleanChannelArtist(media.artist)] : []),
    ].filter((h) => h && h.length > 1);

    async function loadCover() {
      await sleep(COVER_FALLBACK_DELAY_MS, signal);
      if (signal.aborted || hasOwnCoverRef.current) return;
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(`${searchTitle} ${searchArtist}`.trim())}&entity=song&limit=1`;
        const res = await fetch(url, { signal });
        const data = await res.json();
        const art = data.results?.[0]?.artworkUrl100;
        if (art && !signal.aborted) setFallbackCover(art.replace('100x100bb', '300x300bb'));
      } catch {}
    }

    async function loadLyrics() {
      const cached = lyricsCacheRef.current.get(trackKey);
      if (cached) {
        if (signal.aborted) return;
        setLyrics(cached.lyrics);
        setLyricStatus(cached.status);
        return;
      }

      try {
        let lrcData = null;

        lrcData = await queryLrcLib(parsedYT.title, parsedYT.artist, signal, hints);

        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          if (cleanTitle !== parsedYT.title || primaryArtist !== parsedYT.artist) {
            lrcData = await queryLrcLib(cleanTitle, primaryArtist, signal, hints);
          }
        }

        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          const fallbackTitle = parsedYT.title || cleanTitle;
          if (fallbackTitle) {
            lrcData = await queryLrcLib(fallbackTitle, '', signal, hints);
          }
        }

        if (lrcData?.syncedLyrics) {
          const parsed = parseLrc(lrcData.syncedLyrics);
          if (parsed.length > 0) {
            if (signal.aborted) return;
            lyricsCacheRef.current.set(trackKey, { status: 'synced', lyrics: parsed });
            setLyrics(parsed);
            setLyricStatus('synced');
            return;
          }
        }

        if (lrcData?.plainLyrics) {
          const plainLines = lrcData.plainLyrics
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((text) => ({ text }));
          if (plainLines.length > 0) {
            if (signal.aborted) return;
            lyricsCacheRef.current.set(trackKey, { status: 'plain', lyrics: plainLines });
            setLyrics(plainLines);
            setLyricStatus('plain');
            return;
          }
        }

        if (signal.aborted) return;
        lyricsCacheRef.current.set(trackKey, { status: 'not_found', lyrics: [] });
        setLyricStatus('not_found');
      } catch (err) {
        if (err.name !== 'AbortError' && !signal.aborted) {
          setLyricStatus('not_found');
        }
      }
    }

    const debounce = setTimeout(() => {
      started = true;
      lastFetchedTrack.current = trackKey;
      setFallbackCover(null);
      const cached = lyricsCacheRef.current.get(trackKey);
      if (cached) {
        setLyrics(cached.lyrics);
        setLyricStatus(cached.status);
      } else {
        setLyricStatus('loading');
        setLyrics([]);
      }
      Promise.allSettled([loadCover(), loadLyrics()]).then(() => {
        finished = !signal.aborted;
      });
    }, FETCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(debounce);
      controller.abort();
      if (started && !finished && lastFetchedTrack.current === trackKey) {
        lastFetchedTrack.current = '';
      }
    };
  }, [media.title, media.artist, media.hasMedia]);

  const triggerControl = (action) => {
    if (window.electronAPI?.sendMediaControl) {
      window.electronAPI.sendMediaControl(action);
    }
  };

  const handleSeek = (e) => {
    if (!media.hasMedia || media.duration <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = Math.floor(percentage * media.duration);
    setMedia((prev) => ({ ...prev, position: targetSeconds }));
    triggerControl(`seek:${targetSeconds}`);
  };

  const displayCover = media.thumbnail || fallbackCover;

  return {
    media,
    setMedia,
    lyrics,
    lyricStatus,
    fallbackCover,
    displayCover,
    triggerControl,
    handleSeek,
  };
}
