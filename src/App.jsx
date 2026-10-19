import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Disc, Loader2 } from 'lucide-react';

function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const totalSeconds = minutes * 60 + seconds + ms / 1000;
      parsed.push({ time: totalSeconds, text });
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}

function cleanTrackTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*\(.*?(remaster|version|edit|live|feat|ft\.).*?\)/gi, '')
    .replace(/\s*-\s*.*?(remaster|version|edit|live|acoustic).*$/gi, '')
    .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/gi, '')
    .trim();
}

function stripVideoSuffixes(str) {
  if (!str) return '';
  let s = str;

  // 1. Tag kurung video / audio / lyrics / visualizer / mv / live / remaster (termasuk bracket Asia)
  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|performance|live|clip|remaster(?:ed)?|version).*?[)\]}\u3011\u300D\u300F]/gi, '');

  // 2. Kurung sederhana: (Official), [Official], (Lyrics), (Audio), (Visualizer), dll.
  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official|lyrics?|audio|visualizer|hd|4k|mv|m\/v|clip|live)\s*[)\]}\u3011\u300D\u300F]/gi, '');

  // 3. M/V atau MV di akhir kata
  s = s.replace(/\s+(?:m\/?v|mv)\s*$/gi, '');

  // 4. Suffix setelah delimiter pipe atau slash: | Official Video, // Official Audio, dll.
  s = s.replace(/\s*[|/]{1,2}\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|clip).*$/gi, '');

  // 5. Pipe umum di akhir
  s = s.replace(/\s*\|\s*.*$/gi, '');

  // 6. Suffix dash di akhir: - Official Video, - Audio, dll.
  s = s.replace(/\s*-\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|mv|m\/?v|clip).*$/gi, '');

  // 7. Hapus tanda petik pembungkus judul: 'Song Title' -> Song Title
  s = s.trim().replace(/^['"“‘](.*)['"”’]$/, '$1').trim();

  return s;
}

function cleanChannelArtist(artist) {
  if (!artist) return '';
  let cleaned = artist.trim();
  // Strip " - Topic" (YouTube auto-generated music channels)
  cleaned = cleaned.replace(/\s*-\s*Topic$/i, '');
  // Strip "VEVO" di akhir (mis. ColdplayVEVO -> Coldplay)
  cleaned = cleaned.replace(/VEVO$/i, '');
  // Strip "Official Channel", "Official Music", "Official", "Channel"
  cleaned = cleaned.replace(/\s*(?:Official\s*Channel|Official\s*Music|Official|Channel)$/i, '');
  cleaned = cleaned.replace(/Official$/i, '');
  // Strip "Music" di akhir jika diawali spasi
  cleaned = cleaned.replace(/\s+Music$/i, '');
  return cleaned.trim();
}

function isLikelyChannelName(artist) {
  if (!artist) return false;
  const a = artist.trim();
  if (/VEVO$/i.test(a)) return true;
  if (/-\s*Topic$/i.test(a)) return true;
  if (/(?:Official|Channel)$/i.test(a)) return true;
  if (/^(?:YouTube|YouTubeMusic|Chrome|Edge)$/i.test(a)) return true;
  return false;
}

function parseYouTubeTitle(title, artist) {
  if (!title) return { title: '', artist: artist || '', isYouTubeLike: false };

  const rawTitle = title.trim();
  const rawArtist = (artist || '').trim();
  const cleanedChannel = cleanChannelArtist(rawArtist);

  // Cek apakah ada pemisah seperti " - ", " – ", " — "
  const separatorMatch = rawTitle.match(/\s+[-–—]\s+/);

  if (separatorMatch) {
    const parts = rawTitle.split(/\s+[-–—]\s+/);
    if (parts.length >= 2) {
      const leftPart = parts[0].trim();
      const rightPart = parts.slice(1).join(' - ').trim();

      const hasVideoSuffix = /official|video|audio|lyrics?|visualizer|m\/?v|clip/i.test(rawTitle);
      const isChannelLike = isLikelyChannelName(rawArtist);
      const artistMatchesLeft = Boolean(cleanedChannel && leftPart.toLowerCase().includes(cleanedChannel.toLowerCase()));
      const leftMatchesArtist = Boolean(cleanedChannel && cleanedChannel.toLowerCase().includes(leftPart.toLowerCase()));

      if (hasVideoSuffix || isChannelLike || artistMatchesLeft || leftMatchesArtist) {
        const cleanedTitle = cleanTrackTitle(stripVideoSuffixes(rightPart));
        const extractedArtist = leftPart;
        return {
          title: cleanedTitle || stripVideoSuffixes(rightPart),
          artist: extractedArtist || cleanedChannel || rawArtist,
          isYouTubeLike: true,
        };
      }
    }
  }

  // Jika tidak berformat "Artis - Judul", bersihkan video suffixes dari judul
  const cleanedTitle = cleanTrackTitle(stripVideoSuffixes(rawTitle));
  const finalArtist = cleanedChannel || rawArtist;
  const isYouTubeLike = /official|video|audio|lyrics?|visualizer|m\/?v|clip/i.test(rawTitle) || isLikelyChannelName(rawArtist);

  return {
    title: cleanedTitle || rawTitle,
    artist: finalArtist,
    isYouTubeLike,
  };
}

async function queryLrcLib(trackName, artistName, signal) {
  let lrcData = null;
  const cleanTrack = (trackName || '').trim();
  const cleanArt = (artistName || '').trim();

  // 1. Coba endpoint /api/get jika artistName dan trackName ada
  if (cleanTrack && cleanArt) {
    try {
      const primary = cleanArt.split(',')[0].split('&')[0].split(/\s+x\s+/i)[0].trim();
      const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(primary)}&track_name=${encodeURIComponent(cleanTrack)}`;
      const getRes = await fetch(getUrl, { signal });
      if (getRes.ok) {
        lrcData = await getRes.json();
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }
  }

  // 2. Coba endpoint /api/search jika belum dapat synced lyrics
  if (!lrcData || !lrcData.syncedLyrics) {
    try {
      const queryStr = [cleanTrack, cleanArt].filter(Boolean).join(' ').trim();
      if (queryStr) {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(queryStr)}`;
        const searchRes = await fetch(searchUrl, { signal });
        if (searchRes.ok) {
          const results = await searchRes.json();
          if (Array.isArray(results) && results.length > 0) {
            const bestMatch = results.find((item) => item.syncedLyrics) ||
                              results.find((item) => item.plainLyrics) ||
                              results[0];
            if (bestMatch && (bestMatch.syncedLyrics || bestMatch.plainLyrics)) {
              lrcData = bestMatch;
            }
          }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }
  }

  return lrcData;
}

export default function App() {
  const [isHovered, setIsHovered] = useState(false);

  const [media, setMedia] = useState({
    hasMedia: false,
    title: "Belum ada musik",
    artist: "Putar lagu di Spotify / Browser",
    isPlaying: false,
    position: 0,
    duration: 1,
    thumbnail: null,
  });

  const [lyrics, setLyrics] = useState([]);
  const [lyricStatus, setLyricStatus] = useState('idle');
  const [fallbackCover, setFallbackCover] = useState(null);
  const lastFetchedTrack = useRef("");

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onMediaUpdate) return;
    const unsubscribe = window.electronAPI.onMediaUpdate((data) => {
      if (!data.hasMedia) {
        setMedia((prev) => ({
          ...prev,
          hasMedia: false,
          isPlaying: false,
        }));
      } else {
        setMedia((prev) => {
          const diff = Math.abs(prev.position - data.position);
          const smoothPos = (prev.title === data.title && diff <= 1.5) ? prev.position : data.position;
          return {
            ...data,
            thumbnail: data.thumbnail ?? prev.thumbnail,
            position: smoothPos,
          };
        });
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

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

  useEffect(() => {
    if (!media.hasMedia || !media.title || media.title === "Tidak ada judul" || media.title === "Belum ada musik") {
      return;
    }

    const trackKey = `${media.title}___${media.artist}`;
    if (trackKey === lastFetchedTrack.current) return;
    lastFetchedTrack.current = trackKey;

    const controller = new AbortController();
    // Reset fallbackCover saat lagu berganti agar cover lama tidak nempel,
    // tapi thumbnail dari PowerShell (jika ada) tetap tampil via media.thumbnail
    setFallbackCover(null);

    async function fetchTrackExtras() {
      setLyricStatus('loading');
      setLyrics([]);
      // Jangan reset fallbackCover dulu — biarkan cover lama tampil
      // sampai cover baru berhasil di-fetch (mencegah flicker ke ijo)

      const parsedYT = parseYouTubeTitle(media.title, media.artist);
      const cleanTitle = cleanTrackTitle(media.title);
      const primaryArtist = media.artist.split(',')[0].split('&')[0].trim();

      const searchTitle = parsedYT.title || cleanTitle;
      const searchArtist = parsedYT.artist || primaryArtist;

      try {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${searchTitle} ${searchArtist}`.trim())}&entity=song&limit=1`;
        const resArt = await fetch(itunesUrl, { signal: controller.signal });
        const dataArt = await resArt.json();
        if (dataArt.results?.[0]?.artworkUrl100) {
          setFallbackCover(dataArt.results[0].artworkUrl100.replace('100x100bb', '300x300bb'));
        }
      } catch { }

      try {
        let lrcData = null;

        // 1. Coba fetch lirik dengan judul/artis hasil parse YouTube terlebih dahulu
        lrcData = await queryLrcLib(parsedYT.title, parsedYT.artist, controller.signal);

        // 2. Jika tidak ketemu, fallback ke query original
        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          if (cleanTitle !== parsedYT.title || primaryArtist !== parsedYT.artist) {
            lrcData = await queryLrcLib(cleanTitle, primaryArtist, controller.signal);
          }
        }

        // 3. Fallback kedua: coba query hanya dari judul yang sudah dibersihkan tanpa artis
        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          const fallbackTitle = parsedYT.title || cleanTitle;
          if (fallbackTitle) {
            lrcData = await queryLrcLib(fallbackTitle, '', controller.signal);
          }
        }

        if (lrcData?.syncedLyrics) {
          const parsed = parseLrc(lrcData.syncedLyrics);
          if (parsed.length > 0) {
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
            .map((text, idx) => ({ time: idx * 4, text }));
          setLyrics(plainLines);
          setLyricStatus('plain');
          return;
        }

        setLyricStatus('not_found');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setLyricStatus('not_found');
        }
      }
    }

    fetchTrackExtras();
    return () => controller.abort();
  }, [media.title, media.artist, media.hasMedia]);

  // Top-Bezel Trigger Instan (Tanpa Delay)
  const handleMouseMove = (e) => {
    if (isHovered) return;

    if (e.clientY <= 6) {
      setIsHovered(true);
      if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  };

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

  const activeLyricIndex = lyrics.reduce((acc, curr, idx) => {
    return (media.position + 0.25) >= curr.time ? idx : acc;
  }, 0);

  const prevLine = activeLyricIndex > 0 ? lyrics[activeLyricIndex - 1]?.text : "";
  const currentLine = lyrics[activeLyricIndex]?.text || "• • •";
  const nextLine = activeLyricIndex < lyrics.length - 1 ? lyrics[activeLyricIndex + 1]?.text : "";

  const displayCover = media.thumbnail || fallbackCover;

  const formatTime = (sec) => {
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(safeSec / 60).toString().padStart(2, '0');
    const s = (safeSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeString = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateHeaderString = `${now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })} • ${timeString}`;

  return (
    <div className="w-screen h-screen flex justify-center items-start pt-0 pointer-events-none">
      {/* Wrapper Notch MacBook dengan Top-Bezel Trigger Instan */}
      <motion.div
        layout
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={false}
        animate={{
          width: isHovered ? 580 : 172,
          height: isHovered ? 188 : 34,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: isHovered ? 22 : 14,
          borderBottomRightRadius: isHovered ? 22 : 14,
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 32,
        }}
        className="pointer-events-auto relative bg-[#0a0a0c]/95 text-white border-x border-b border-t-0 border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col justify-between origin-top"
      >
        {/* Lekukan Bahu Kiri Atas (MacBook Left Ear) */}
        <svg
          className="absolute -left-[12px] top-0 w-[12px] h-[12px] pointer-events-none"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M 0 0 L 12 0 L 12 12 C 12 5.37 6.63 0 0 0 Z"
            fill="rgba(10, 10, 12, 0.95)"
          />
        </svg>

        {/* Lekukan Bahu Kanan Atas (MacBook Right Ear) */}
        <svg
          className="absolute -right-[12px] top-0 w-[12px] h-[12px] pointer-events-none"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M 0 0 L 12 0 C 5.37 0 0 5.37 0 12 Z"
            fill="rgba(10, 10, 12, 0.95)"
          />
        </svg>

        {/* Inner Container */}
        <div className="w-full h-full overflow-hidden rounded-[inherit] flex flex-col justify-between">
          {/* TAMPILAN SAAT MENUTUP (IDLE NOTCH) */}
          {!isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full px-3.5 flex items-center justify-between text-xs font-sans font-semibold tracking-wide"
            >
              {/* Vinyl Cover Art */}
              {displayCover ? (
                <img
                  src={displayCover}
                  alt="cover"
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-white/15 animate-spin"
                  style={{
                    animationDuration: "8s",
                    animationPlayState: media.isPlaying ? "running" : "paused",
                  }}
                />
              ) : (
                <div
                  className="w-4 h-4 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center animate-spin"
                  style={{
                    animationDuration: "8s",
                    animationPlayState: media.isPlaying ? "running" : "paused",
                  }}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${media.isPlaying ? "bg-emerald-400" : "bg-white/40"
                      }`}
                  />
                </div>
              )}

              {/* Jam Digital */}
              <span className="text-white/90 font-mono font-medium text-[12.5px] tracking-tight">
                {timeString}
              </span>

              {/* Minimalist Monochrome Waveform */}
              <div className="flex items-center gap-[2px] h-3">
                {[0.45, 0.95, 0.55, 0.85, 0.4].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      height: media.isPlaying ? ["25%", "95%", "35%"] : "20%",
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.65 + i * 0.12,
                      ease: "easeInOut",
                    }}
                    className="w-[2px] bg-white/75 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* TAMPILAN SAAT MEMBUKA (EXPANDED NOTCH) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, delay: 0.03 }}
                className="w-full h-full px-4 py-3.5 flex flex-col justify-between z-10"
              >
                {/* Header Bar Atas */}
                <div className="flex items-center justify-between text-[11px] text-white/50 border-b border-white/[0.07] pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${media.isPlaying ? "bg-emerald-400" : "bg-white/30"
                        }`}
                    />
                    <span className="font-sans font-semibold text-white/85 tracking-tight">
                      Ryflow
                    </span>
                  </div>
                  <span className="font-mono text-white/60 text-[10.5px]">
                    {dateHeaderString}
                  </span>
                  <div className="flex items-center gap-1.5 font-sans font-medium text-[10.5px] text-white/50">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${lyricStatus === 'synced' ? "bg-white/70" : "bg-white/25"
                        }`}
                    />
                    <span>Lyrics</span>
                  </div>
                </div>

                {/* Konten Utama: Kiri (5 Kolom Kontrol) & Kanan (7 Kolom Lirik Lega) */}
                <div className="grid grid-cols-12 gap-4 items-center my-auto py-0.5">

                  {/* KIRI: Info Lagu & Kontrol (5 Kolom) */}
                  <div className="col-span-5 flex flex-col gap-2.5 pr-3 border-r border-white/[0.07]">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shadow-md shrink-0 bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center">
                        {displayCover ? (
                          <img
                            src={displayCover}
                            alt={media.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Disc size={22} className="text-white/40" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-[13px] font-sans font-bold text-white truncate leading-tight">
                          {media.title}
                        </h3>
                        <p className="text-[11.5px] font-sans text-white/55 truncate mt-0.5">
                          {media.artist}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar Bersih */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/45">
                      <span className="w-7">{formatTime(media.position)}</span>
                      <div
                        onClick={handleSeek}
                        className="group flex-1 h-1 hover:h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer transition-all"
                      >
                        <motion.div
                          className="h-full bg-white/90 group-hover:bg-white rounded-full"
                          animate={{
                            width: `${Math.min(
                              100,
                              (media.position / Math.max(1, media.duration)) * 100
                            )}%`,
                          }}
                          transition={{ ease: "linear", duration: 0.25 }}
                        />
                      </div>
                      <span className="w-8 text-right">
                        -{formatTime(media.duration - media.position)}
                      </span>
                    </div>

                    {/* Tombol Kontrol */}
                    <div className="flex items-center justify-center gap-5 pt-0.5">
                      <button
                        onClick={() => triggerControl('prev')}
                        className="text-white/60 hover:text-white transition transform active:scale-90 cursor-pointer"
                      >
                        <SkipBack size={16} />
                      </button>
                      <button
                        onClick={() => triggerControl('playpause')}
                        className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer"
                      >
                        {media.isPlaying ? (
                          <Pause size={14} fill="black" />
                        ) : (
                          <Play size={14} fill="black" className="ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={() => triggerControl('next')}
                        className="text-white/60 hover:text-white transition transform active:scale-90 cursor-pointer"
                      >
                        <SkipForward size={16} />
                      </button>
                    </div>
                  </div>

                  {/* KANAN: Synced Lyrics (7 Kolom) */}
                  <div className="col-span-7 h-28 flex flex-col justify-center overflow-hidden relative pl-1">
                    {lyricStatus === 'loading' && (
                      <div className="flex items-center gap-2 text-xs font-sans text-white/40">
                        <Loader2 size={13} className="animate-spin text-white/60" />
                        <span>Memuat lirik...</span>
                      </div>
                    )}

                    {lyricStatus === 'not_found' && (
                      <p className="text-xs font-sans font-medium text-white/35">
                        Lirik tidak tersedia
                      </p>
                    )}

                    {(lyricStatus === 'synced' || lyricStatus === 'plain') && (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activeLyricIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="flex flex-col justify-center gap-1.5 font-sans"
                        >
                          <p className="text-[11.5px] font-medium text-white/30 line-clamp-1 leading-normal">
                            {prevLine || "\u00A0"}
                          </p>
                          <p className="text-[13.5px] font-bold text-white leading-snug line-clamp-2">
                            {currentLine}
                          </p>
                          <p className="text-[11.5px] font-medium text-white/35 line-clamp-1 leading-normal">
                            {nextLine || "\u00A0"}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}