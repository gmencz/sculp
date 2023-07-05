export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toPostgresQuery(str: string) {
  return str
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" & ");
}

export function makeListString(arr: (string | number)[]) {
  if (arr.length === 1) return arr[0];
  const firsts = arr.slice(0, arr.length - 1);
  const last = arr.at(-1)?.toString();
  return firsts.join(", ") + " and " + last;
}

export function timeToSeconds(timeStr: string) {
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes * 60 + seconds;
}

export function secondsToTime(seconds: number) {
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return m + ":" + s;
}
