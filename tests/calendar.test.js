import { describe, it, expect } from 'vitest';
import { getWeekDays } from '../src/services/calendar.js';

describe('getWeekDays', () => {
  it('highlights Monday correctly (index 0)', () => {
    const week = getWeekDays('2026-11-23');
    expect(week).toHaveLength(7);
    expect(week.map((d) => d.dateNum)).toEqual([23, 24, 25, 26, 27, 28, 29]);
    expect(week[0]).toEqual({ label: 'Sen', dateNum: 23, isToday: true });
    expect(week.filter((d) => d.isToday)).toHaveLength(1);
  });

  it('highlights Sunday correctly (index 6)', () => {
    const week = getWeekDays('2026-11-29');
    expect(week.map((d) => d.dateNum)).toEqual([23, 24, 25, 26, 27, 28, 29]);
    expect(week[6]).toEqual({ label: 'Min', dateNum: 29, isToday: true });
    expect(week.filter((d) => d.isToday)).toHaveLength(1);
  });

  it('handles month boundary rollover', () => {
    const week = getWeekDays('2026-11-30');
    expect(week.map((d) => d.dateNum)).toEqual([30, 1, 2, 3, 4, 5, 6]);
    expect(week[0]).toEqual({ label: 'Sen', dateNum: 30, isToday: true });
  });

  it('handles year boundary rollover on Dec 31 and Jan 1', () => {
    const dec31 = getWeekDays('2026-12-31');
    expect(dec31.map((d) => d.dateNum)).toEqual([28, 29, 30, 31, 1, 2, 3]);
    expect(dec31[3]).toEqual({ label: 'Kam', dateNum: 31, isToday: true });

    const jan1 = getWeekDays('2027-01-01');
    expect(jan1.map((d) => d.dateNum)).toEqual([28, 29, 30, 31, 1, 2, 3]);
    expect(jan1[4]).toEqual({ label: 'Jum', dateNum: 1, isToday: true });
  });
});
