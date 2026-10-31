import { describe, it, expect, vi } from 'vitest';
import {
  getWeatherInfo,
  getBrowserCoordinates,
  getIpGeolocation,
  getReverseGeocoding,
  fetchWeatherData,
  DEFAULT_COORDS,
  DEFAULT_CITY,
} from '../src/services/weather.js';

describe('getWeatherInfo', () => {
  it('returns Cerah for code 0', () => {
    expect(getWeatherInfo(0)).toEqual({ label: 'Cerah', icon: 'sun' });
  });

  it('returns Berawan for codes 1-3', () => {
    expect(getWeatherInfo(1)).toEqual({ label: 'Berawan', icon: 'cloud' });
    expect(getWeatherInfo(2)).toEqual({ label: 'Berawan', icon: 'cloud' });
    expect(getWeatherInfo(3)).toEqual({ label: 'Berawan', icon: 'cloud' });
  });

  it('returns Berkabut for codes 45, 48', () => {
    expect(getWeatherInfo(45)).toEqual({ label: 'Berkabut', icon: 'wind' });
    expect(getWeatherInfo(48)).toEqual({ label: 'Berkabut', icon: 'wind' });
  });

  it('returns Hujan for rain codes', () => {
    expect(getWeatherInfo(51)).toEqual({ label: 'Hujan', icon: 'cloud-rain' });
    expect(getWeatherInfo(67)).toEqual({ label: 'Hujan', icon: 'cloud-rain' });
    expect(getWeatherInfo(80)).toEqual({ label: 'Hujan', icon: 'cloud-rain' });
    expect(getWeatherInfo(82)).toEqual({ label: 'Hujan', icon: 'cloud-rain' });
  });

  it('returns Badai Petir for codes >= 95', () => {
    expect(getWeatherInfo(95)).toEqual({ label: 'Badai Petir', icon: 'cloud-lightning' });
    expect(getWeatherInfo(99)).toEqual({ label: 'Badai Petir', icon: 'cloud-lightning' });
  });

  it('defaults to Berawan for unknown codes between 4-44', () => {
    expect(getWeatherInfo(10)).toEqual({ label: 'Berawan', icon: 'cloud' });
  });
});

describe('getBrowserCoordinates', () => {
  it('rejects when navigator.geolocation is not available', async () => {
    Object.defineProperty(global, 'navigator', { value: {}, writable: true });
    await expect(getBrowserCoordinates()).rejects.toThrow('Geolocation tidak didukung');
  });

  it('resolves with coordinates when geolocation succeeds', async () => {
    const mockGetCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: -6.2, longitude: 106.8 } })
    );
    Object.defineProperty(global, 'navigator', {
      value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
      writable: true,
    });
    const result = await getBrowserCoordinates();
    expect(result).toEqual({ lat: -6.2, lon: 106.8 });
  });

  it('rejects when geolocation fails', async () => {
    const mockGetCurrentPosition = vi.fn((_, fail) => fail(new Error('Permission denied')));
    Object.defineProperty(global, 'navigator', {
      value: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
      writable: true,
    });
    await expect(getBrowserCoordinates()).rejects.toThrow('Permission denied');
  });
});

describe('getIpGeolocation', () => {
  it('parses geo data correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ latitude: '-6.2', longitude: '106.8', city: 'Jakarta' }),
    });
    const result = await getIpGeolocation();
    expect(result).toEqual({ lat: -6.2, lon: 106.8, city: 'Jakarta' });
  });

  it('throws on failed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(getIpGeolocation()).rejects.toThrow('IP geolocation failed');
  });

  it('throws on invalid data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await expect(getIpGeolocation()).rejects.toThrow('Invalid geo data');
  });
});

describe('getReverseGeocoding', () => {
  it('extracts city from address', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ address: { city: 'Jakarta Selatan' } }),
    });
    const result = await getReverseGeocoding(-6.2, 106.8);
    expect(result).toBe('Jakarta Selatan');
  });

  it('falls back through address hierarchy', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ address: { town: 'Depok' } }),
    });
    const result = await getReverseGeocoding(-6.2, 106.8);
    expect(result).toBe('Depok');
  });

  it('removes Kota/Kabupaten prefix', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ address: { city: 'Kota Bandung' } }),
    });
    const result = await getReverseGeocoding(-6.2, 106.8);
    expect(result).toBe('Bandung');
  });

  it('throws on failed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(getReverseGeocoding(-6.2, 106.8)).rejects.toThrow('Reverse geocoding failed');
  });
});

describe('fetchWeatherData', () => {
  it('parses weather data correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        current: { temperature_2m: 28.7, relative_humidity_2m: 65, weather_code: 1 },
      }),
    });
    const result = await fetchWeatherData(-6.2, 106.8);
    expect(result).toEqual({ temp: 29, humidity: 65, code: 1 });
  });

  it('throws on failed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(fetchWeatherData(-6.2, 106.8)).rejects.toThrow('Weather fetch failed');
  });
});

describe('constants', () => {
  it('exports default coordinates and city', () => {
    expect(DEFAULT_COORDS).toEqual({ lat: -5.4292, lon: 105.261 });
    expect(DEFAULT_CITY).toBe('Bandar Lampung');
  });
});