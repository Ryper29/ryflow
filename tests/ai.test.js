import { describe, it, expect, vi } from 'vitest';
import {
  validateApiKey,
  detectAiProvider,
  mapAiHttpError,
  callAiAgent,
} from '../src/services/ai.js';

describe('validateApiKey', () => {
  it('rejects empty key', () => {
    expect(validateApiKey('')).toEqual({ valid: false, message: 'API Key tidak boleh kosong.' });
    expect(validateApiKey('   ')).toEqual({ valid: false, message: 'API Key tidak boleh kosong.' });
  });

  it('rejects key with spaces', () => {
    expect(validateApiKey('sk-abc def')).toEqual({ valid: false, message: 'API Key tidak boleh mengandung spasi.' });
  });

  it('rejects short key', () => {
    expect(validateApiKey('sk-123')).toEqual({ valid: false, message: 'API Key terlalu pendek (minimal 10 karakter).' });
  });

  it('accepts valid keys', () => {
    expect(validateApiKey('sk-ant-validkey123')).toEqual({ valid: true });
    expect(validateApiKey('AIzaValidKey123')).toEqual({ valid: true });
    expect(validateApiKey('gsk_ValidKey123')).toEqual({ valid: true });
  });
});

describe('detectAiProvider', () => {
  it('detects Anthropic (sk-ant-)', () => {
    const result = detectAiProvider('sk-ant-abc123', 'gemini-model');
    expect(result).toEqual({ id: 'anthropic', name: 'Claude 3.5 Haiku', model: 'claude-3-5-haiku-latest' });
  });

  it('detects Gemini (AQ prefix)', () => {
    const result = detectAiProvider('AQabc123', 'gemini-flash-latest');
    expect(result.id).toBe('gemini');
    expect(result.model).toBe('gemini-flash-latest');
  });

  it('detects Gemini (AIza prefix)', () => {
    const result = detectAiProvider('AIzaabc123', 'gemini-flash-latest');
    expect(result.id).toBe('gemini');
  });

  it('detects Grok (grok_ prefix)', () => {
    const result = detectAiProvider('grok_abc123', 'gemini-model');
    expect(result).toEqual({ id: 'grok', name: 'Grok', model: 'grok-2-latest' });
  });

  it('detects Grok (xai- prefix)', () => {
    const result = detectAiProvider('xai-abc123', 'gemini-model');
    expect(result.id).toBe('grok');
  });

  it('detects Groq (gsk_ prefix)', () => {
    const result = detectAiProvider('gsk_abc123', 'gemini-model');
    expect(result).toEqual({ id: 'groq', name: 'Groq Llama 3.3', model: 'llama-3.3-70b-versatile' });
  });

  it('detects OpenAI (sk- prefix)', () => {
    const result = detectAiProvider('sk-abc123', 'gemini-model');
    expect(result).toEqual({ id: 'openai', name: 'OpenAI GPT-4o Mini', model: 'gpt-4o-mini' });
  });

  it('defaults to Gemini for unknown prefix', () => {
    const result = detectAiProvider('unknownkey123', 'gemini-flash-latest');
    expect(result.id).toBe('gemini');
    expect(result.model).toBe('gemini-flash-latest');
  });

  it('defaults to Gemini for empty key', () => {
    const result = detectAiProvider('', 'gemini-flash-latest');
    expect(result.id).toBe('gemini');
    expect(result.model).toBe('gemini-flash-latest');
  });
});

describe('mapAiHttpError', () => {
  it('maps 401/403 to auth error', () => {
    expect(mapAiHttpError(401)).toBe('API Key salah atau sudah kedaluwarsa. Coba ganti API Key.');
    expect(mapAiHttpError(403)).toBe('API Key salah atau sudah kedaluwarsa. Coba ganti API Key.');
    expect(mapAiHttpError(401, 'invalid api key')).toBe('API Key salah atau sudah kedaluwarsa. Coba ganti API Key.');
  });

  it('maps 429 to rate limit', () => {
    expect(mapAiHttpError(429)).toBe('Terlalu banyak permintaan. Coba lagi beberapa saat.');
    expect(mapAiHttpError(200, 'rate limit exceeded')).toBe('Terlalu banyak permintaan. Coba lagi beberapa saat.');
  });

  it('maps 5xx to server error', () => {
    expect(mapAiHttpError(500)).toBe('Server AI sedang bermasalah. Coba beberapa menit lagi.');
    expect(mapAiHttpError(503)).toBe('Server AI sedang bermasalah. Coba beberapa menit lagi.');
  });

  it('returns raw message for other errors', () => {
    expect(mapAiHttpError(400, 'Bad request')).toBe('Bad request');
  });

  it('returns default for unknown error', () => {
    expect(mapAiHttpError(404)).toBe('Gagal memproses permintaan AI.');
  });
});

describe('callAiAgent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws when offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: false, writable: true });
    await expect(callAiAgent({ apiKey: 'sk-ant-validkey', prompt: 'test', systemPrompt: 'test' }))
      .rejects.toThrow('Tidak ada koneksi internet.');
  });

  it('throws on invalid API key', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, writable: true });
    await expect(callAiAgent({ apiKey: '', prompt: 'test', systemPrompt: 'test' }))
      .rejects.toThrow('API Key tidak boleh kosong.');
  });

  it('throws on short API key', async () => {
    await expect(callAiAgent({ apiKey: 'short', prompt: 'test', systemPrompt: 'test' }))
      .rejects.toThrow('API Key terlalu pendek');
  });
});