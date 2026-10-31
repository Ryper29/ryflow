import { useState, useEffect, useMemo } from 'react';
import { Sun, Cloud, Wind, CloudRain, CloudLightning } from 'lucide-react';
import { fetchFullWeather, getWeatherInfo } from '../services/weather.js';

const WEATHER_ICONS = {
  sun: Sun,
  cloud: Cloud,
  wind: Wind,
  'cloud-rain': CloudRain,
  'cloud-lightning': CloudLightning,
};

export function useWeather(now) {
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

  const getWeekDays = (currentDate) => {
    // oxlint-disable-next-line react/purity -- Date constructor needed for deterministic date arithmetic
    const current = new Date(currentDate.getTime());
    const dayOfWeek = current.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    // oxlint-disable-next-line react/purity -- Date constructor needed for deterministic date arithmetic
    const monday = new Date(current.getTime());
    monday.setDate(current.getDate() + diffToMonday);

    const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return Array.from({ length: 7 }, (_, i) => {
      // oxlint-disable-next-line react/purity
      const d = new Date(monday.getTime());
      d.setDate(monday.getDate() + i);
      // oxlint-disable-next-line react/purity
      const isToday = d.toDateString() === new Date(currentDate.getTime()).toDateString();
      return {
        label: dayLabels[i],
        dateNum: d.getDate(),
        isToday,
      };
    });
  };

  const weekDays = useMemo(() => {
    // oxlint-disable-next-line react/purity
    return now ? getWeekDays(now) : getWeekDays(new Date());
  }, [now]);

  return {
    weather,
    weatherLabel,
    WeatherIcon,
    weekDays,
  };
}