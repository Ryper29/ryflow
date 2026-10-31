import { describe, it, expect } from 'vitest';
import {
  parseLrc,
  pickBestMatch,
  cleanTrackTitle,
  stripVideoSuffixes,
  cleanChannelArtist,
  isLikelyChannelName,
  parseYouTubeTitle,
} from '../src/services/lyrics.js';

describe('parseLrc', () => {
  it('parses basic LRC format', () => {
    const lrc = '[00:12.34]Hello world\n[00:15.67]This is a test';
    const result = parseLrc(lrc);
    expect(result).toEqual([
      { time: 12.34, text: 'Hello world' },
      { time: 15.67, text: 'This is a test' },
    ]);
  });

  it('handles multiple timestamps on same line', () => {
    const lrc = '[00:10.00][00:12.00]Same text';
    const result = parseLrc(lrc);
    expect(result).toEqual([
      { time: 10, text: 'Same text' },
      { time: 12, text: 'Same text' },
    ]);
  });

  it('ignores empty lines and lines without text', () => {
    const lrc = '[00:10.00]\n\n[00:12.00]Real text';
    const result = parseLrc(lrc);
    expect(result).toEqual([{ time: 12, text: 'Real text' }]);
  });

  it('returns empty array for empty input', () => {
    expect(parseLrc('')).toEqual([]);
    expect(parseLrc(null)).toEqual([]);
  });
});

describe('pickBestMatch', () => {
  const mockResults = [
    { trackName: 'Song Title', artistName: 'Artist One', syncedLyrics: '[00:00]Lyrics', plainLyrics: null },
    { trackName: 'Song Title', artistName: 'Artist Two', syncedLyrics: null, plainLyrics: 'Plain lyrics' },
    { trackName: 'Different Song', artistName: 'Artist One', syncedLyrics: '[00:00]Lyrics', plainLyrics: null },
  ];

  it('returns null for empty title', () => {
    expect(pickBestMatch(mockResults, '', ['Artist One'])).toBeNull();
  });

  it('prefers synced lyrics over plain', () => {
    const result = pickBestMatch(mockResults, 'Song Title', ['Artist One']);
    expect(result.syncedLyrics).toBeTruthy();
  });

  it('matches artist hints', () => {
    const result = pickBestMatch(mockResults, 'Song Title', ['Artist Two']);
    expect(result.artistName).toBe('Artist Two');
  });

  it('returns null when no match', () => {
    const result = pickBestMatch(mockResults, 'Unknown', ['Artist One']);
    expect(result).toBeNull();
  });
});

describe('cleanTrackTitle', () => {
  it('removes remaster suffix', () => {
    expect(cleanTrackTitle('Song (Remastered)')).toBe('Song');
  });

  it('removes live version suffix', () => {
    expect(cleanTrackTitle('Song - Live Version')).toBe('Song');
  });

  it('removes feat suffix', () => {
    expect(cleanTrackTitle('Song feat. Artist')).toBe('Song');
  });

  it('returns empty string for empty input', () => {
    expect(cleanTrackTitle('')).toBe('');
  });
});

describe('stripVideoSuffixes', () => {
  it('removes (Official Video) suffix', () => {
    expect(stripVideoSuffixes('Song (Official Video)')).toBe('Song');
  });

  it('removes [MV] suffix', () => {
    expect(stripVideoSuffixes('Song [MV]')).toBe('Song');
  });

  it('removes (Lyrics) suffix', () => {
    expect(stripVideoSuffixes('Song (Lyrics)')).toBe('Song');
  });

  it('removes | suffix', () => {
    expect(stripVideoSuffixes('Song | Official Video')).toBe('Song');
  });

  it('handles unicode brackets', () => {
    expect(stripVideoSuffixes('Song \u3010Official Video\u3011')).toBe('Song');
  });
});

describe('cleanChannelArtist', () => {
  it('removes - Topic suffix', () => {
    expect(cleanChannelArtist('Artist - Topic')).toBe('Artist');
  });

  it('removes VEVO suffix', () => {
    expect(cleanChannelArtist('ArtistVEVO')).toBe('Artist');
  });

  it('removes Official Channel suffix', () => {
    expect(cleanChannelArtist('Artist Official Channel')).toBe('Artist');
  });
});

describe('isLikelyChannelName', () => {
  it('detects VEVO', () => {
    expect(isLikelyChannelName('ArtistVEVO')).toBe(true);
  });

  it('detects - Topic', () => {
    expect(isLikelyChannelName('Artist - Topic')).toBe(true);
  });

  it('detects Official suffix', () => {
    expect(isLikelyChannelName('Artist Official')).toBe(true);
  });

  it('detects YouTube names', () => {
    expect(isLikelyChannelName('YouTube')).toBe(true);
    expect(isLikelyChannelName('YouTubeMusic')).toBe(true);
  });

  it('returns false for normal artists', () => {
    expect(isLikelyChannelName('Taylor Swift')).toBe(false);
  });
});

describe('parseYouTubeTitle', () => {
  it('parses standard "Artist - Title" format', () => {
    const result = parseYouTubeTitle('Taylor Swift - Blank Space', 'TaylorSwiftVEVO');
    expect(result.title).toBe('Blank Space');
    expect(result.artist).toBe('Taylor Swift');
    expect(result.isYouTubeLike).toBe(true);
  });

  it('handles video suffixes in title', () => {
    const result = parseYouTubeTitle('Taylor Swift - Blank Space (Official Video)', 'TaylorSwiftVEVO');
    expect(result.title).toBe('Blank Space');
    expect(result.isYouTubeLike).toBe(true);
  });

  it('cleans channel artist name', () => {
    const result = parseYouTubeTitle('Taylor Swift - Blank Space', 'Taylor Swift - Topic');
    expect(result.artist).toBe('Taylor Swift');
  });

  it('returns original when not YouTube-like', () => {
    const result = parseYouTubeTitle('Blank Space', 'Taylor Swift');
    expect(result.title).toBe('Blank Space');
    expect(result.artist).toBe('Taylor Swift');
    expect(result.isYouTubeLike).toBe(false);
  });

  it('handles missing title', () => {
    const result = parseYouTubeTitle('', 'Artist');
    expect(result.title).toBe('');
    expect(result.artist).toBe('Artist');
  });
});