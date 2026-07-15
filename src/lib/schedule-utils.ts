const PUBLISH_SLOTS = [10, 15, 22, 3];
export const STORY_SLOTS = [10, 20];

export interface SlotResult {
  lastPublishedAt: Date | null;
  nextSuggestedAt: Date;
  ruleMatched: boolean;
  fallbackUsed: boolean;
}

export function getNextContentSlot(
  lastPublishedAt: Date | null,
  timezone: string = "America/Sao_Paulo",
  slots: number[] = PUBLISH_SLOTS
): SlotResult {
  const now = new Date();
  const tzOffset = getTimezoneOffset(timezone);

  if (!lastPublishedAt) {
    return getInitialSlot(now, tzOffset, slots);
  }

  const lastHour = lastPublishedAt.getHours();
  const lastSlotIndex = slots.indexOf(lastHour);

  if (lastSlotIndex === -1) {
    return getNextSlotFromNonStandard(lastPublishedAt, tzOffset, slots);
  }

  const nextSlotIndex = (lastSlotIndex + 1) % slots.length;
  const nextHour = slots[nextSlotIndex];

  let nextSuggestedAt = new Date(lastPublishedAt);
  nextSuggestedAt.setHours(nextHour, 0, 0, 0);

  if (nextHour <= lastHour) {
    nextSuggestedAt.setDate(nextSuggestedAt.getDate() + 1);
  }

  if (nextSuggestedAt <= now) {
    nextSuggestedAt = findNextAvailableSlot(now, tzOffset, slots);
  }

  return {
    lastPublishedAt,
    nextSuggestedAt,
    ruleMatched: true,
    fallbackUsed: false,
  };
}

function getInitialSlot(now: Date, tzOffset: number, slots: number[]): SlotResult {
  const nextSlot = findNextAvailableSlot(now, tzOffset, slots);
  return {
    lastPublishedAt: null,
    nextSuggestedAt: nextSlot,
    ruleMatched: false,
    fallbackUsed: true,
  };
}

function getNextSlotFromNonStandard(lastPublishedAt: Date, tzOffset: number, slots: number[]): SlotResult {
  const now = new Date();
  const lastHour = lastPublishedAt.getHours();

  let closestSlot = slots[0];
  let minDiff = Infinity;

  for (const slot of slots) {
    let diff = slot - lastHour;
    if (diff <= 0) diff += 24;
    if (diff < minDiff) {
      minDiff = diff;
      closestSlot = slot;
    }
  }

  let nextSuggestedAt = new Date(lastPublishedAt);
  nextSuggestedAt.setHours(closestSlot, 0, 0, 0);

  if (closestSlot <= lastHour || nextSuggestedAt <= now) {
    nextSuggestedAt.setDate(nextSuggestedAt.getDate() + 1);
    nextSuggestedAt.setHours(closestSlot, 0, 0, 0);
  }

  if (nextSuggestedAt <= now) {
    nextSuggestedAt = findNextAvailableSlot(now, tzOffset, slots);
  }

  return {
    lastPublishedAt,
    nextSuggestedAt,
    ruleMatched: false,
    fallbackUsed: true,
  };
}

function findNextAvailableSlot(from: Date, tzOffset: number, slots: number[] = PUBLISH_SLOTS): Date {
  const candidate = new Date(from);
  candidate.setHours(slots[0], 0, 0, 0);

  if (candidate > from) {
    return candidate;
  }

  for (let i = 1; i < slots.length; i++) {
    candidate.setHours(slots[i], 0, 0, 0);
    if (candidate > from) {
      return candidate;
    }
  }

  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(slots[0], 0, 0, 0);
  return candidate;
}

function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return -3;
  }
}

export function formatDateTimeForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateTimeDisplay(date: Date, locale: string = "pt-BR"): string {
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
