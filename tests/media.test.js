import { describe, it, expect } from 'vitest';
import {
  ALLOWED_MEDIA_COMMANDS,
  SEEK_PATTERN,
  validateMediaCommand,
  sanitizeMediaCommand,
  validateMouseOptions,
  validateApiKeyInput,
} from '../src/services/media.js';

describe('validateMediaCommand', () => {
  it('accepts playpause', () => {
    expect(validateMediaCommand('playpause')).toBe(true);
  });

  it('accepts next', () => {
    expect(validateMediaCommand('next')).toBe(true);
  });

  it('accepts prev', () => {
    expect(validateMediaCommand('prev')).toBe(true);
  });

  it('accepts valid seek commands', () => {
    expect(validateMediaCommand('seek:0')).toBe(true);
    expect(validateMediaCommand('seek:1')).toBe(true);
    expect(validateMediaCommand('seek:123')).toBe(true);
    expect(validateMediaCommand('seek:45.5')).toBe(true);
    expect(validateMediaCommand('seek:100.0')).toBe(true);
  });

  it('rejects invalid seek commands', () => {
    expect(validateMediaCommand('seek:-1')).toBe(false);
    expect(validateMediaCommand('seek:01')).toBe(false);
    expect(validateMediaCommand('seek:')).toBe(false);
    expect(validateMediaCommand('seek:abc')).toBe(false);
  });

  it('rejects unknown commands', () => {
    expect(validateMediaCommand('stop')).toBe(false);
    expect(validateMediaCommand('volume:50')).toBe(false);
    expect(validateMediaCommand('')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(validateMediaCommand(null)).toBe(false);
    expect(validateMediaCommand(undefined)).toBe(false);
    expect(validateMediaCommand(123)).toBe(false);
    expect(validateMediaCommand({})).toBe(false);
  });
});

describe('sanitizeMediaCommand', () => {
  it('trims whitespace', () => {
    expect(sanitizeMediaCommand('  playpause  ')).toBe('playpause');
  });

  it('returns empty string for non-string', () => {
    expect(sanitizeMediaCommand(null)).toBe('');
    expect(sanitizeMediaCommand(undefined)).toBe('');
    expect(sanitizeMediaCommand(123)).toBe('');
  });
});

describe('validateMouseOptions', () => {
  it('returns { forward: true } when forward is true', () => {
    expect(validateMouseOptions({ forward: true })).toEqual({ forward: true });
  });

  it('returns undefined for other values', () => {
    expect(validateMouseOptions({ forward: false })).toBeUndefined();
    expect(validateMouseOptions({ forward: 'true' })).toBeUndefined();
    expect(validateMouseOptions({})).toBeUndefined();
    expect(validateMouseOptions(null)).toBeUndefined();
    expect(validateMouseOptions(undefined)).toBeUndefined();
  });
});

describe('validateApiKeyInput', () => {
  it('accepts valid string', () => {
    expect(validateApiKeyInput('valid-key-123')).toBe(true);
  });

  it('rejects non-string', () => {
    expect(validateApiKeyInput(null)).toBe(false);
    expect(validateApiKeyInput(undefined)).toBe(false);
    expect(validateApiKeyInput(123)).toBe(false);
  });

  it('rejects overly long key', () => {
    expect(validateApiKeyInput('a'.repeat(4097))).toBe(false);
  });

  it('rejects key with newlines', () => {
    expect(validateApiKeyInput('key\nwith\nnewlines')).toBe(false);
    expect(validateApiKeyInput('key\rwith\rcarriage')).toBe(false);
  });
});

describe('ALLOWED_MEDIA_COMMANDS', () => {
  it('contains expected commands', () => {
    expect(ALLOWED_MEDIA_COMMANDS.has('playpause')).toBe(true);
    expect(ALLOWED_MEDIA_COMMANDS.has('next')).toBe(true);
    expect(ALLOWED_MEDIA_COMMANDS.has('prev')).toBe(true);
    expect(ALLOWED_MEDIA_COMMANDS.size).toBe(3);
  });
});

describe('SEEK_PATTERN', () => {
  it('matches valid seek patterns', () => {
    expect(SEEK_PATTERN.test('seek:0')).toBe(true);
    expect(SEEK_PATTERN.test('seek:1')).toBe(true);
    expect(SEEK_PATTERN.test('seek:999')).toBe(true);
    expect(SEEK_PATTERN.test('seek:10.5')).toBe(true);
    expect(SEEK_PATTERN.test('seek:0.0')).toBe(true);
  });

  it('does not match invalid patterns', () => {
    expect(SEEK_PATTERN.test('seek:-1')).toBe(false);
    expect(SEEK_PATTERN.test('seek:01')).toBe(false);
    expect(SEEK_PATTERN.test('seek:')).toBe(false);
    expect(SEEK_PATTERN.test('seek:abc')).toBe(false);
    expect(SEEK_PATTERN.test('playpause')).toBe(false);
  });
});