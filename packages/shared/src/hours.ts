export function activeHoursFrom(times: Date[]): number[] {
  const hours = Array<number>(24).fill(0);
  for (const time of times) hours[time.getHours()] += 1;
  const peak = Math.max(...hours);
  return peak === 0 ? hours : hours.map((value) => Math.round((value / peak) * 9));
}
