export function parseLrc(lrcText) {
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

const normKey = (s) =>
  String(s ?? '').replace(/\s+/g, ' ').trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');

const titleKey = (s) =>
  normKey(String(s ?? '').replace(/[([（【][^)\]）】]*[)\]）】]/g, ' ').replace(/\s+-\s+.*$/, '')) || normKey(s);

export function pickBestMatch(results, title, hints) {
  const wanted = titleKey(title);
  if (!wanted) return null;
  const wantedArtists = hints.map(normKey).filter((h) => h.length >= 2);
  const matches = results.filter((r) => {
    if (!r || !(r.syncedLyrics || r.plainLyrics) || titleKey(r.trackName) !== wanted) return false;
    const ra = normKey(r.artistName);
    return wantedArtists.some(
      (h) => h === ra || (h.length >= 3 && ra.length >= 3 && (ra.includes(h) || h.includes(ra)))
    );
  });
  const score = (r) => (r.syncedLyrics ? 2 : 0) + (normKey(r.trackName) === normKey(title) ? 1 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0] || null;
}

export function cleanTrackTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*\(.*?(remaster|version|edit|live|feat|ft\.).*?\)/gi, '')
    .replace(/\s*-\s*.*?(remaster|version|edit|live|acoustic).*$/gi, '')
    .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/gi, '')
    .trim();
}

export function stripVideoSuffixes(str) {
  if (!str) return '';
  let s = str;

  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|performance|live|clip|remaster(?:ed)?|version).*?[)\]}\u3011\u300D\u300F]/gi, '');
  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official|lyrics?|audio|visualizer|hd|4k|mv|m\/v|clip|live)\s*[)\]}\u3011\u300D\u300F]/gi, '');
  s = s.replace(/\s+(?:m\/?v|mv)\s*$/gi, '');
  s = s.replace(/\s*[|/]{1,2}\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|clip).*$/gi, '');
  s = s.replace(/\s*\|\s*.*$/gi, '');
  s = s.replace(/\s*-\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|mv|m\/?v|clip).*$/gi, '');
  s = s.trim().replace(/^['"“‘](.*)['"”’]$/, '$1').trim();

  return s;
}

export function cleanChannelArtist(artist) {
  if (!artist) return '';
  let cleaned = artist.trim();
  cleaned = cleaned.replace(/\s*-\s*Topic$/i, '');
  cleaned = cleaned.replace(/VEVO$/i, '');
  cleaned = cleaned.replace(/\s*(?:Official\s*Channel|Official\s*Music|Official|Channel)$/i, '');
  cleaned = cleaned.replace(/Official$/i, '');
  cleaned = cleaned.replace(/\s+Music$/i, '');
  return cleaned.trim();
}

export function isLikelyChannelName(artist) {
  if (!artist) return false;
  const a = artist.trim();
  if (/VEVO$/i.test(a)) return true;
  if (/-\s*Topic$/i.test(a)) return true;
  if (/(?:Official|Channel)$/i.test(a)) return true;
  if (/^(?:YouTube|YouTubeMusic|Chrome|Edge)$/i.test(a)) return true;
  return false;
}

export function parseYouTubeTitle(title, artist) {
  if (!title) return { title: '', artist: artist || '', isYouTubeLike: false };

  const rawTitle = title.trim();
  const rawArtist = (artist || '').trim();
  const cleanedChannel = cleanChannelArtist(rawArtist);

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

  const cleanedTitle = cleanTrackTitle(stripVideoSuffixes(rawTitle));
  const finalArtist = cleanedChannel || rawArtist;
  const isYouTubeLike = /official|video|audio|lyrics?|visualizer|m\/?v|clip/i.test(rawTitle) || isLikelyChannelName(rawArtist);

  return {
    title: cleanedTitle || rawTitle,
    artist: finalArtist,
    isYouTubeLike,
  };
}

export async function queryLrcLib(trackName, artistName, signal, hints = []) {
  let lrcData = null;
  const cleanTrack = (trackName || '').trim();
  const cleanArt = (artistName || '').trim();

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

  if (!lrcData || !lrcData.syncedLyrics) {
    try {
      if (cleanTrack) {
        let searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}`;
        if (cleanArt) searchUrl += `&artist_name=${encodeURIComponent(cleanArt)}`;
        const searchRes = await fetch(searchUrl, { signal });
        if (searchRes.ok) {
          const results = await searchRes.json();
          if (Array.isArray(results) && results.length > 0) {
            const allHints = hints.length > 0 ? hints : (cleanArt ? [cleanArt] : []);
            const best = allHints.length > 0
              ? pickBestMatch(results, cleanTrack, allHints)
              : (results.find((item) => item.syncedLyrics) || results.find((item) => item.plainLyrics) || results[0]);
            if (best && (best.syncedLyrics || best.plainLyrics) && (!lrcData || best.syncedLyrics)) {
              lrcData = best;
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