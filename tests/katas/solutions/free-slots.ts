type Slot = { start: string; end: string };

const DAY_START = 9 * 60;
const DAY_END = 18 * 60;

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function reference(meetings: Slot[], minMinutes: number): Slot[] {
  const busy = meetings
    .map(({ start, end }) => ({ start: toMinutes(start), end: toMinutes(end) }))
    .map((meeting) => {
      if (meeting.end <= meeting.start) throw new RangeError("A meeting must end after it starts");
      return { start: Math.max(meeting.start, DAY_START), end: Math.min(meeting.end, DAY_END) };
    })
    .filter((meeting) => meeting.start < meeting.end)
    .sort((first, second) => first.start - second.start);
  const free: Slot[] = [];
  let cursor = DAY_START;
  for (const meeting of [...busy, { start: DAY_END, end: DAY_END }]) {
    if (meeting.start - cursor >= minMinutes) free.push({ start: toTime(cursor), end: toTime(meeting.start) });
    cursor = Math.max(cursor, meeting.end);
  }
  return free;
}

// What a vague spec ("list the gaps between meetings") typically produces:
// assumes sorted, non-overlapping meetings inside working hours.
export function naive(meetings: Slot[], minMinutes: number): Slot[] {
  const free: Slot[] = [];
  let cursor = "09:00";
  for (const meeting of [...meetings, { start: "18:00", end: "18:00" }]) {
    if (toMinutes(meeting.start) - toMinutes(cursor) >= minMinutes) free.push({ start: cursor, end: meeting.start });
    cursor = meeting.end;
  }
  return free;
}
