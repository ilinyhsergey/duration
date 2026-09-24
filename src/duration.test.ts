import { describe, expect, it } from 'vitest';
import { Duration } from './duration.ts';
import { DurationPrecisionFormat } from './model/duration-precision-format.ts';

const { secondMs, minuteMs, hourMs, dayMs } = Duration;

describe('Duration', () => {

  describe('константы', () => {

    it('переводят единицы времени в миллисекунды', () => {
      expect(secondMs).toBe(1_000);
      expect(minuteMs).toBe(60_000);
      expect(hourMs).toBe(3_600_000);
      expect(dayMs).toBe(86_400_000);
    });

    it('empty — нулевая длительность', () => {
      expect(Duration.empty.valueOf()).toBe(0);
    });

  });

  describe('фабрики', () => {

    it('fromMilliseconds сохраняет переданное значение', () => {
      expect(Duration.fromMilliseconds(1234).valueOf()).toBe(1234);
      expect(Duration.fromMilliseconds(-1234).valueOf()).toBe(-1234);
    });

    it('fromConfig суммирует все поля конфигурации', () => {
      const duration = Duration.fromConfig({ days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 });
      expect(duration.valueOf()).toBe(2 * dayMs + 3 * hourMs + 4 * minuteMs + 5 * secondMs + 6);
    });

    it('fromConfig считает пропущенные поля нулями', () => {
      expect(Duration.fromConfig({}).valueOf()).toBe(0);
      expect(Duration.fromConfig({ minutes: 90 }).valueOf()).toBe(90 * minuteMs);
    });

    it('fromConfig нормализует переполнение разрядов', () => {
      expect(Duration.fromConfig({ hours: 25 }).valueOf()).toBe(dayMs + hourMs);
      expect(Duration.fromConfig({ seconds: 3661 }).valueOf()).toBe(hourMs + minuteMs + secondMs);
    });

    it('fromConfig принимает отрицательные поля', () => {
      expect(Duration.fromConfig({ hours: 1, minutes: -30 }).valueOf()).toBe(30 * minuteMs);
    });

    it('fromDates возвращает разницу между датами', () => {
      const start = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
      const end = new Date(Date.UTC(2025, 0, 2, 3, 0, 0));
      expect(Duration.fromDates(start, end).valueOf()).toBe(dayMs + 3 * hourMs);
    });

    it('fromDates возвращает отрицательное значение, если end раньше start', () => {
      const start = new Date(Date.UTC(2025, 0, 2));
      const end = new Date(Date.UTC(2025, 0, 1));
      expect(Duration.fromDates(start, end).valueOf()).toBe(-dayMs);
    });

  });

  describe('иммутабельность', () => {

    it('экземпляр заморожен', () => {
      expect(Object.isFrozen(Duration.fromMilliseconds(1))).toBe(true);
    });

    it('арифметика не меняет исходный экземпляр', () => {
      const original = Duration.fromConfig({ hours: 1 });
      original.add(Duration.fromConfig({ hours: 1 }));
      original.subtract(Duration.fromConfig({ hours: 1 }));
      original.multiply(10);
      expect(original.valueOf()).toBe(hourMs);
    });

    it('clone создаёт равный, но другой объект', () => {
      const original = Duration.fromConfig({ minutes: 42 });
      const copy = original.clone();
      expect(copy).not.toBe(original);
      expect(copy.valueOf()).toBe(original.valueOf());
    });

  });

  describe('арифметика', () => {

    it('add складывает длительности', () => {
      expect(Duration.fromConfig({ hours: 1 }).add(Duration.fromConfig({ minutes: 30 })).valueOf())
        .toBe(90 * minuteMs);
    });

    it('subtract вычитает длительности и допускает отрицательный результат', () => {
      expect(Duration.fromConfig({ minutes: 30 }).subtract(Duration.fromConfig({ hours: 1 })).valueOf())
        .toBe(-30 * minuteMs);
    });

    it('multiply умножает на число', () => {
      expect(Duration.fromMilliseconds(1500).multiply(3).valueOf()).toBe(4500);
      expect(Duration.fromMilliseconds(1500).multiply(0).valueOf()).toBe(0);
    });

    it('divide делит на число', () => {
      expect(Duration.fromMilliseconds(1500).divide(4).valueOf()).toBe(375);
    });

    it('divide на ноль даёт Infinity', () => {
      expect(Duration.fromMilliseconds(1500).divide(0).valueOf()).toBe(Infinity);
    });

    it('inverse меняет знак', () => {
      expect(Duration.fromMilliseconds(1500).inverse().valueOf()).toBe(-1500);
      expect(Duration.fromMilliseconds(-1500).inverse().valueOf()).toBe(1500);
    });

    it('addTo сдвигает дату, не мутируя её', () => {
      const date = new Date(Date.UTC(2025, 0, 31, 12, 0, 0));
      const shifted = Duration.fromConfig({ days: 1 }).addTo(date);
      expect(shifted.toISOString()).toBe('2025-02-01T12:00:00.000Z');
      expect(date.toISOString()).toBe('2025-01-31T12:00:00.000Z');
    });

    it('addTo с отрицательной длительностью сдвигает назад', () => {
      const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
      expect(Duration.fromConfig({ hours: 1 }).inverse().addTo(date).toISOString())
        .toBe('2024-12-31T23:00:00.000Z');
    });

  });

  describe('valueOf', () => {

    it('позволяет складывать экземпляры через оператор +', () => {
      const sum = Number(Duration.fromConfig({ hours: 1 })) + Number(Duration.fromConfig({ hours: 2 }));
      expect(sum).toBe(3 * hourMs);
    });

    it('позволяет сравнивать экземпляры через операторы', () => {
      expect(Duration.fromConfig({ hours: 1 }) < Duration.fromConfig({ hours: 2 })).toBe(true);
      expect(Duration.fromConfig({ hours: 3 }) > Duration.fromConfig({ hours: 2 })).toBe(true);
    });

  });

  describe('toConfig', () => {

    it('раскладывает длительность по разрядам', () => {
      const duration = Duration.fromConfig({ days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 });
      expect(duration.toConfig()).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 });
    });

    it('возвращает нули для пустой длительности', () => {
      expect(Duration.empty.toConfig()).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    });

    it('не переполняет разряды', () => {
      expect(Duration.fromMilliseconds(dayMs - 1).toConfig())
        .toEqual({ days: 0, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
    });

    it('делает отрицательными все разряды отрицательной длительности', () => {
      expect(Duration.fromMilliseconds(-(hourMs + 2 * minuteMs + 3 * secondMs + 4)).toConfig())
        .toEqual({ days: 0, hours: -1, minutes: -2, seconds: -3, milliseconds: -4 });
    });

    it('нормализует -0 до 0', () => {
      const config = Duration.fromMilliseconds(-1).toConfig();
      expect(Object.is(config.days, 0)).toBe(true);
      expect(Object.is(config.hours, 0)).toBe(true);
      expect(config.milliseconds).toBe(-1);
    });

  });

  describe('toFormat', () => {

    it('по умолчанию использует точность hours', () => {
      const duration = Duration.fromConfig({ days: 2, hours: 3 });
      expect(duration.toFormat()).toBe(duration.toFormat(DurationPrecisionFormat.hours));
    });

    it('отбрасывает разряды ниже запрошенной точности', () => {
      const duration = Duration.fromConfig({ days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 });
      expect(duration.toFormat(DurationPrecisionFormat.hours)).toBe('2д');
      expect(duration.toFormat(DurationPrecisionFormat.minutes)).toBe('2д 3ч');
      expect(duration.toFormat(DurationPrecisionFormat.seconds)).toBe('2д 3ч 4м');
      expect(duration.toFormat(DurationPrecisionFormat.milliseconds)).toBe('2д 3ч 4м 5с');
    });

    it('показывает ноль в единицах запрошенной точности, если старшие разряды пусты', () => {
      const duration = Duration.fromConfig({ minutes: 5 });
      expect(duration.toFormat(DurationPrecisionFormat.hours)).toBe('0ч');
      expect(Duration.empty.toFormat(DurationPrecisionFormat.seconds)).toBe('0с');
      expect(Duration.empty.toFormat(DurationPrecisionFormat.milliseconds)).toBe('0мс');
    });

    it('с isIncreasePrecisionForZero показывает старший ненулевой разряд вместо нуля', () => {
      expect(Duration.fromConfig({ minutes: 5 }).toFormat(DurationPrecisionFormat.hours, true)).toBe('5м');
      expect(Duration.fromConfig({ seconds: 5 }).toFormat(DurationPrecisionFormat.hours, true)).toBe('5с');
      expect(Duration.fromMilliseconds(42).toFormat(DurationPrecisionFormat.hours, true)).toBe('42мс');
    });

    it('с isIncreasePrecisionForZero не влияет на ненулевой основной формат', () => {
      const duration = Duration.fromConfig({ days: 2, hours: 3, minutes: 4 });
      expect(duration.toFormat(DurationPrecisionFormat.minutes, true)).toBe('2д 3ч');
    });

    it('для нулевой длительности с isIncreasePrecisionForZero показывает общее число миллисекунд', () => {
      expect(Duration.empty.toFormat(DurationPrecisionFormat.hours, true)).toBe('0мс');
    });

    it('toString эквивалентен toFormat со значениями по умолчанию', () => {
      const duration = Duration.fromConfig({ days: 1, hours: 2 });
      expect(String(duration)).toBe(duration.toFormat());
      expect(`${duration}`).toBe('1д');
    });

  });

  // Поведение ниже выглядит непреднамеренным, но зафиксировано как есть,
  // чтобы изменения в нём были заметны. Подробности — в описании каждого теста.
  describe('текущие особенности форматирования', () => {

    it('точность days всегда даёт "0д": старший разряд отбрасывается вместе с остальными', () => {
      expect(Duration.fromConfig({ days: 2 }).toFormat(DurationPrecisionFormat.days)).toBe('0д');
      expect(Duration.fromConfig({ days: 2 }).toFormat(DurationPrecisionFormat.days, true)).toBe('2д');
    });

    it('пропущенные старшие разряды оставляют ведущие пробелы', () => {
      expect(Duration.fromConfig({ hours: 1, minutes: 2 }).toFormat(DurationPrecisionFormat.seconds))
        .toBe(' 1ч 2м');
      expect(Duration.fromConfig({ minutes: 2, seconds: 3 }).toFormat(DurationPrecisionFormat.milliseconds))
        .toBe('  2м 3с');
    });

    it('у отрицательной длительности знак повторяется у каждого разряда', () => {
      expect(Duration.fromMilliseconds(-(hourMs + 2 * minuteMs + 3 * secondMs + 4))
        .toFormat(DurationPrecisionFormat.milliseconds)).toBe(' -1ч -2м -3с');
    });

  });

});
