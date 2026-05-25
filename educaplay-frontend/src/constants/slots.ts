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

// Returns the 7 aula slots with default interval positions.
export function getSlotsForTurno(turno: string): Slot[] {
  return computeAulaSlots(turno, DEFAULT_INT1_GAP, DEFAULT_INT2_GAP);
}
