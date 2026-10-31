export const DEFAULT_COORDS = { lat: -5.4292, lon: 105.261 };
export const DEFAULT_CITY = 'Bandar Lampung';

export function getWeatherInfo(code) {
  if (code === 0) return { label: 'Cerah', icon: 'sun' };
  if (code >= 1 && code <= 3) return { label: 'Berawan', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Berkabut', icon: 'wind' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: 'Hujan', icon: 'cloud-rain' };
  }
  if (code >= 95) return { label: 'Badai Petir', icon: 'cloud-lightning' };
  return { label: 'Berawan', icon: 'cloud' };
}

export async function getBrowserCoordinates() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation tidak didukung');
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

export async function getIpGeolocation() {
  const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
  if (!geoRes.ok) throw new Error('IP geolocation failed');
  const geoData = await geoRes.json();
  if (!geoData.latitude || !geoData.longitude) throw new Error('Invalid geo data');
  return {
    lat: parseFloat(geoData.latitude),
    lon: parseFloat(geoData.longitude),
    city: geoData.city || geoData.region || DEFAULT_CITY,
  };
}

export async function getReverseGeocoding(lat, lon) {
  const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`;
  const nomRes = await fetch(nomUrl, { headers: { Accept: 'application/json' } });
  if (!nomRes.ok) throw new Error('Reverse geocoding failed');
  const nomData = await nomRes.json();
  const addr = nomData.address || {};
  const resolvedCity =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    addr.state;
  if (resolvedCity) {
    return resolvedCity.replace(/^(?:Kota|Kabupaten)\s+/i, '').trim();
  }
  throw new Error('City not found in address');
}

export async function fetchWeatherData(lat, lon) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
  const wRes = await fetch(weatherUrl);
  if (!wRes.ok) throw new Error('Weather fetch failed');
  const wData = await wRes.json();
  return {
    temp: Math.round(wData.current.temperature_2m),
    humidity: Math.round(wData.current.relative_humidity_2m),
    code: wData.current.weather_code,
  };
}

export async function fetchFullWeather(_signal) {
  let lat = DEFAULT_COORDS.lat;
  let lon = DEFAULT_COORDS.lon;
  let cityName = DEFAULT_CITY;

  try {
    const coords = await getBrowserCoordinates();
    if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
      lat = coords.lat;
      lon = coords.lon;
    }
  } catch {
    try {
      const geo = await getIpGeolocation();
      lat = geo.lat;
      lon = geo.lon;
      cityName = geo.city;
    } catch { }
  }

  try {
    const city = await getReverseGeocoding(lat, lon);
    cityName = city;
  } catch { }

  const weather = await fetchWeatherData(lat, lon);

  return {
    ...weather,
    city: cityName,
    loading: false,
  };
}