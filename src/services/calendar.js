const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function getWeekDays(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const dayOfWeek = current.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(y, m - 1, d + diffToMonday + i);
    return {
      label: DAY_LABELS[i],
      dateNum: date.getDate(),
      isToday: i === todayIdx,
    };
  });
}
