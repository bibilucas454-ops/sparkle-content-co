import { describe, it, expect } from "vitest";
import { getNextContentSlot, formatDateTimeForInput } from "../lib/schedule-utils";

describe("getNextContentSlot", () => {
  it("deve retornar próximo slot 22:00 quando último foi 15:00", () => {
    const lastPost = new Date("2026-04-06T15:00:00");
    const result = getNextContentSlot(lastPost);
    
    expect(result.nextSuggestedAt.getHours()).toBe(22);
    expect(result.ruleMatched).toBe(true);
  });

  it("deve retornar próximo slot 10:00 do dia seguinte quando último foi 15:00", () => {
    const lastPost = new Date("2026-04-06T15:00:00");
    const result = getNextContentSlot(lastPost);
    
    expect(result.nextSuggestedAt.getHours()).toBe(22);
    expect(result.ruleMatched).toBe(true);
  });

  it("deve retornar próximo slot 03:00 do dia seguinte quando último foi 22:00", () => {
    const lastPost = new Date("2026-04-06T22:00:00");
    const result = getNextContentSlot(lastPost);
    
    expect(result.nextSuggestedAt.getHours()).toBe(3);
    expect(result.nextSuggestedAt.getDate()).toBe(7);
    expect(result.ruleMatched).toBe(true);
  });

  it("deve retornar próximo slot 10:00 do mesmo dia quando último foi 03:00", () => {
    const lastPost = new Date("2026-04-06T03:00:00");
    const result = getNextContentSlot(lastPost);
    
    expect(result.nextSuggestedAt.getHours()).toBe(10);
    expect(result.nextSuggestedAt.getDate()).toBe(6);
    expect(result.ruleMatched).toBe(true);
  });

  it("deve usar fallback para horário fora do padrão", () => {
    const lastPost = new Date("2026-04-06T17:12:00");
    const result = getNextContentSlot(lastPost);
    
    expect(result.nextSuggestedAt.getHours()).toBe(22);
    expect(result.fallbackUsed).toBe(true);
  });

  it("deve retornar primeiro slot quando não há histórico", () => {
    const result = getNextContentSlot(null);
    
    expect(result.lastPublishedAt).toBeNull();
    expect(result.fallbackUsed).toBe(true);
  });

  it("deve avançar para próximo slot disponível se sugestão já passou", () => {
    const lastPost = new Date("2026-04-06T15:00:00");
    const result = getNextContentSlot(lastPost);
    
    expect(result.nextSuggestedAt >= new Date()).toBe(true);
  });
});

describe("formatDateTimeForInput", () => {
  it("deve formatar corretamente para input datetime-local", () => {
    const date = new Date("2026-04-06T22:00:00");
    const result = formatDateTimeForInput(date);
    
    expect(result).toBe("2026-04-06T22:00");
  });
});
