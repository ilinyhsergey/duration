import { describe, expect, it } from 'vitest';
import { reformatTime } from './time-formatter.ts';

// Таймзона зафиксирована как UTC в vitest.setup.ts, иначе результаты зависят от машины.
describe('reformatTime', () => {

  it('форматирует Date как "ЧЧ:ММ ДД.ММ.ГГ"', () => {
    expect(reformatTime(new Date(Date.UTC(2025, 8, 24, 14, 30)))).toBe('14:30 24.09.25');
  });

  it('принимает ISO-строку', () => {
    expect(reformatTime('2025-09-24T14:30:00Z')).toBe('14:30 24.09.25');
  });

  it('дополняет нулями часы, минуты, день и месяц', () => {
    expect(reformatTime(new Date(Date.UTC(2025, 0, 2, 3, 4)))).toBe('03:04 02.01.25');
  });

  it('использует 24-часовой формат', () => {
    expect(reformatTime(new Date(Date.UTC(2025, 8, 24, 0, 0)))).toBe('00:00 24.09.25');
    expect(reformatTime(new Date(Date.UTC(2025, 8, 24, 23, 59)))).toBe('23:59 24.09.25');
  });

  it('обрезает год до двух последних цифр', () => {
    expect(reformatTime(new Date(Date.UTC(2007, 10, 5, 8, 9)))).toBe('08:09 05.11.07');
  });

  it('отбрасывает секунды и миллисекунды без округления минут', () => {
    expect(reformatTime(new Date(Date.UTC(2025, 8, 24, 14, 30, 59, 999)))).toBe('14:30 24.09.25');
  });

  it('учитывает таймзону окружения', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Europe/Moscow';
    try {
      expect(reformatTime('2025-09-24T23:30:00Z')).toBe('02:30 25.09.25');
    } finally {
      process.env.TZ = originalTz;
    }
  });

  it('бросает RangeError на неразбираемой строке', () => {
    expect(() => reformatTime('nonsense')).toThrow(RangeError);
  });

});
