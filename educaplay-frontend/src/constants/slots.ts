export type Slot = { start: string; end: string };

export type ScheduleItem = {
  key: string;
  type: "aula" | "intervalo";
  label: string;
  start: string;
  end: string;
  slotIndex?: number;
  intervalId?: "i1" | "i2";
};

export const DEFAULT_INT1_GAP = 2;
export const DEFAULT_INT2_GAP = 5;
export const SLOT_H = 68;
export const INT_H = 58;

function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function baseMins(turno: string): number {
  return turno === "matutino" ? 7 * 60 : 13 * 60;
}

// Builds the ordered list: 7 aulas + 2 intervals, times computed from turno start.
// gap 0 = before slot 1, gap 1 = after slot 1, ..., gap 7 = after slot 7.
export function computeSchedule(
  turno: string,
  int1Gap: number,
  int2Gap: number
): ScheduleItem[] {
  let cur = baseMins(turno);
  const items: ScheduleItem[] = [];
  let slotIdx = 0;
  for (let gap = 0; gap <= 7; gap++) {
    if (int1Gap === gap) {
      items.push({
        key: "i1", type: "intervalo", label: "Intervalo 1",
        start: minutesToHHMM(cur), end: minutesToHHMM(cur + 15), intervalId: "i1",
      });
      cur += 15;
    }
    if (int2Gap === gap) {
      items.push({
        key: "i2", type: "intervalo", label: "Intervalo 2",
        start: minutesToHHMM(cur), end: minutesToHHMM(cur + 15), intervalId: "i2",
      });
      cur += 15;
    }
    if (gap < 7) {
      slotIdx++;
      items.push({
        key: `a${slotIdx}`, type: "aula", label: `Aula ${slotIdx}`,
        start: minutesToHHMM(cur), end: minutesToHHMM(cur + 45), slotIndex: slotIdx,
      });
      cur += 45;
    }
  }
  return items;
}

export function computeAulaSlots(turno: string, int1Gap: number, int2Gap: number): Slot[] {
  return computeSchedule(turno, int1Gap, int2Gap)
    .filter(i => i.type === "aula")
    .map(i => ({ start: i.start, end: i.end }));
}

export function intervalStorageKey(turno: string): string {
  return `@educaplay_interval_config_${turno}`;
}

export function intervalStorageKeyPerDay(turno: string, dia: string): string {
  return `@educaplay_interval_config_${turno}_${dia}`;
}

// Derives the slot index (1-7) from a stored timeStart without needing gap values.
// Works because: elapsed = numAulas*45 + numIntervals*15, and elapsed%45 ∈ {0,15,30}.
export function timeToSlotIndex(turno: string, timeStart: string): number | null {
  const parts = timeStart.split(":");
  if (parts.length < 2) return null;
  const totalMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  if (isNaN(totalMins)) return null;
  const base = turno === "matutino" ? 7 * 60 : 13 * 60;
  const elapsed = totalMins - base;
  if (elapsed < 0) return null;
  const rem = elapsed % 45;
  const numIntervals = rem === 0 ? 0 : rem === 15 ? 1 : rem === 30 ? 2 : -1;
  if (numIntervals < 0) return null;
  const numAulas = (elapsed - numIntervals * 15) / 45;
  if (!Number.isInteger(numAulas) || numAulas < 0 || numAulas > 6) return null;
  return numAulas + 1;
}

// Returns the 7 aula slots with default interval positions.
export function getSlotsForTurno(turno: string): Slot[] {
  return computeAulaSlots(turno, DEFAULT_INT1_GAP, DEFAULT_INT2_GAP);
}
