import { useState, useEffect, useMemo } from 'react';

const fmtTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const fmtDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
const minuteNow = () => Math.floor(Date.now() / 60_000);
const pad = (n) => String(n).padStart(2, '0');

export function useClock() {
  const [minute, setMinute] = useState(minuteNow);

  useEffect(() => {
    // cek tiap 10 dtk; state angka yang sama = React bail-out, tanpa render
    const id = setInterval(() => setMinute(minuteNow()), 10_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const now = new Date(minute * 60_000);
    const timeString = fmtTime.format(now);
    return {
      now,
      timeString,
      dateHeaderString: `${fmtDay.format(now)} • ${timeString}`,
      dayKey: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    };
  }, [minute]);
}
