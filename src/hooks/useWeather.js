import { useState, useEffect, useMemo } from 'react';
import { Sun, Cloud, Wind, CloudRain, CloudLightning } from 'lucide-react';
import { fetchFullWeather, getWeatherInfo } from '../services/weather.js';
import { getWeekDays } from '../services/calendar.js';

const WEATHER_ICONS = {
  sun: Sun,
  cloud: Cloud,
  wind: Wind,
  'cloud-rain': CloudRain,
  'cloud-lightning': CloudLightning,
};

export function useWeather(dayKey) {
  const [weather, setWeather] = useState({
    temp: '--',
    code: 1,
    humidity: '--',
    city: 'Memuat...',
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        const data = await fetchFullWeather();
        if (isMounted) {
          setWeather(data);
        }
      } catch {
        if (isMounted) {
          setWeather((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    loadWeather();
    const interval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const { label: weatherLabel, icon } = getWeatherInfo(weather.code);
  const WeatherIcon = WEATHER_ICONS[icon] || Cloud;

  const weekDays = useMemo(() => getWeekDays(dayKey), [dayKey]);

  return {
    weather,
    weatherLabel,
    WeatherIcon,
    weekDays,
  };
}
