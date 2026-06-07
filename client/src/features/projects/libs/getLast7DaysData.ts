export function getLast7DaysData(commitActivity: any[] = []) {
  const sorted = [...commitActivity].sort((a: any, b: any) => a.week - b.week);
  const now = new Date();

  // Generate the last 7 calendar days (including today as the last element)
  const last7DaysDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Create a map of existing db commit dates -> commit count
  const dbDaysMap: Record<string, number> = {};
  sorted.forEach((weekData) => {
    const weekStart = new Date(weekData.week * 1000);
    weekData.days.forEach((dayCount: number, dayIndex: number) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + dayIndex);
      dbDaysMap[dayDate.toDateString()] = dayCount;
    });
  });

  // Map each of the 7 dates to their count and label
  return last7DaysDates.map((date) => {
    const dateStr = date.toDateString();
    const count = dbDaysMap[dateStr] || 0;
    const isToday = date.toDateString() === now.toDateString();
    const dateLabel = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    return {
      count,
      label: `${isToday ? "Today (" + dateLabel + ")" : dateLabel}: ${count} commit${count === 1 ? "" : "s"}`,
    };
  });
}
