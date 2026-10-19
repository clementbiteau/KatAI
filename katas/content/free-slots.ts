import type { Kata } from "../types.ts";

const fullDay = [{ start: "09:00", end: "18:00" }];

export const freeSlots: Kata = {
  id: "free-slots",
  title: "Free slots",
  level: "hard",
  summary: "List the free slots of a working day from a messy list of meetings.",
  statement: `Write a function that lists the free slots of a working day.

The working day runs from 09:00 to 18:00. Meetings are given as { start, end } objects with times in "HH:MM" 24-hour format.

Rules:
- Meetings can come in any order, can overlap, and can touch (one ends when the next starts). Touching meetings leave no free time between them.
- Only the part of a meeting inside working hours matters; time outside 09:00 to 18:00 is ignored.
- A free slot is a period inside working hours that no meeting covers.
- Only return free slots that last at least minMinutes minutes.
- Return the slots sorted by start time, as { start, end } objects with times formatted "HH:MM" (two digits each, for example "09:05").
- If a meeting ends at or before its start, throw a RangeError.`,
  functionName: "freeSlots",
  signature: "freeSlots(meetings: { start: string; end: string }[], minMinutes: number): { start: string; end: string }[]",
  tests: [
    { label: "An empty agenda leaves the whole day free", args: [[], 30], expected: fullDay },
    {
      label: "One meeting splits the day",
      args: [[{ start: "10:00", end: "11:00" }], 30],
      expected: [
        { start: "09:00", end: "10:00" },
        { start: "11:00", end: "18:00" },
      ],
    },
    {
      label: "Meetings may come in any order",
      args: [
        [
          { start: "14:00", end: "15:00" },
          { start: "10:00", end: "11:00" },
        ],
        30,
      ],
      expected: [
        { start: "09:00", end: "10:00" },
        { start: "11:00", end: "14:00" },
        { start: "15:00", end: "18:00" },
      ],
    },
    {
      label: "Nested and overlapping meetings merge",
      args: [
        [
          { start: "10:00", end: "14:00" },
          { start: "11:00", end: "12:00" },
          { start: "13:30", end: "15:00" },
        ],
        30,
      ],
      expected: [
        { start: "09:00", end: "10:00" },
        { start: "15:00", end: "18:00" },
      ],
    },
    {
      label: "Touching meetings leave no gap",
      args: [
        [
          { start: "10:00", end: "11:00" },
          { start: "11:00", end: "12:00" },
        ],
        30,
      ],
      expected: [
        { start: "09:00", end: "10:00" },
        { start: "12:00", end: "18:00" },
      ],
    },
    {
      label: "A meeting starting before 09:00 is clipped",
      args: [[{ start: "08:00", end: "09:30" }], 30],
      expected: [{ start: "09:30", end: "18:00" }],
    },
    {
      label: "A meeting after 18:00 is ignored",
      args: [[{ start: "18:30", end: "19:00" }], 30],
      expected: fullDay,
    },
    {
      label: "Gaps shorter than minMinutes are dropped",
      args: [
        [
          { start: "10:00", end: "11:00" },
          { start: "11:20", end: "12:00" },
        ],
        30,
      ],
      expected: [
        { start: "09:00", end: "10:00" },
        { start: "12:00", end: "18:00" },
      ],
    },
    {
      label: "A gap of exactly minMinutes is kept",
      args: [
        [
          { start: "10:00", end: "11:00" },
          { start: "11:30", end: "12:00" },
        ],
        30,
      ],
      expected: [
        { start: "09:00", end: "10:00" },
        { start: "11:00", end: "11:30" },
        { start: "12:00", end: "18:00" },
      ],
    },
    { label: "A fully booked day has no free slot", args: [[{ start: "08:00", end: "19:00" }], 30], expected: [] },
    {
      label: "Times keep two digits",
      args: [[{ start: "09:05", end: "09:50" }], 5],
      expected: [
        { start: "09:00", end: "09:05" },
        { start: "09:50", end: "18:00" },
      ],
    },
    {
      label: "A meeting ending before it starts throws a RangeError",
      args: [[{ start: "11:00", end: "10:00" }], 30],
      throws: "RangeError",
    },
  ],
};
