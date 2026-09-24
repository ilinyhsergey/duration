# duration

Иммутабельный класс для работы с длительностями и форматирования времени.
Без зависимостей, ESM + CJS, с типами TypeScript.

*Read this in [English](./README.en.md).*

## Установка

```bash
npm install duration
```

## Быстрый старт

```ts
import { Duration, DurationPrecisionFormat, reformatTime } from 'duration';

const d = Duration.fromConfig({ days: 2, hours: 3, minutes: 4 });

d.toFormat();                                    // '2д'
d.toFormat(DurationPrecisionFormat.minutes);     // '2д 3ч'
d.toConfig();                                    // { days: 2, hours: 3, minutes: 4, seconds: 0, milliseconds: 0 }
d.valueOf();                                     // 183840000

reformatTime('2025-09-24T14:30:00Z');            // '14:30 24.09.25'
```

## Создание

| Метод | Описание |
| --- | --- |
| `Duration.fromMilliseconds(ms)` | Длительность из числа миллисекунд. |
| `Duration.fromConfig(config)` | Из объекта `{ days, hours, minutes, seconds, milliseconds }`. Пропущенные поля считаются нулями, переполнение нормализуется (`{ hours: 25 }` → 1 день 1 час), отрицательные значения допустимы. |
| `Duration.fromDates(start, end)` | Разница между датами. Если `end` раньше `start`, результат отрицательный. |
| `Duration.empty` | Нулевая длительность. |

Константы пересчёта: `Duration.secondMs`, `minuteMs`, `hourMs`, `dayMs`.

## Арифметика

Экземпляр заморожен через `Object.freeze`, поэтому **все операции возвращают новый объект** и никогда не меняют исходный:

```ts
const hour = Duration.fromConfig({ hours: 1 });

hour.add(Duration.fromConfig({ minutes: 30 }));  // 1ч 30м
hour.subtract(Duration.fromConfig({ hours: 2 })); // -1ч
hour.multiply(3);                                 // 3ч
hour.divide(4);                                   // 15м
hour.inverse();                                   // -1ч
hour.clone();                                     // равная копия, другой объект
hour.valueOf();                                   // 3600000 — hour не изменился
```

`addTo(date)` сдвигает дату на длительность и возвращает **новый** `Date`, не мутируя переданный:

```ts
Duration.fromConfig({ days: 1 }).addTo(new Date('2025-01-31T12:00:00Z'));
// 2025-02-01T12:00:00.000Z
```

## Сравнение

`valueOf()` возвращает число миллисекунд, поэтому экземпляры работают с обычными операторами:

```ts
Duration.fromConfig({ hours: 1 }) < Duration.fromConfig({ hours: 2 }); // true
Number(a) + Number(b);                                                 // сумма в мс
```

## Форматирование

### `toFormat(precisionFormat?, isIncreasePrecisionForZero?)`

Собирает строку из разрядов **строго старше** указанной точности. По умолчанию точность — `hours`, то есть выводятся только дни:

```ts
const d = Duration.fromConfig({ days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 });

d.toFormat(DurationPrecisionFormat.hours);        // '2д'
d.toFormat(DurationPrecisionFormat.minutes);      // '2д 3ч'
d.toFormat(DurationPrecisionFormat.seconds);      // '2д 3ч 4м'
d.toFormat(DurationPrecisionFormat.milliseconds); // '2д 3ч 4м 5с'
```

Если все старшие разряды пусты, выводится ноль в единицах запрошенной точности:

```ts
Duration.fromConfig({ minutes: 5 }).toFormat(DurationPrecisionFormat.hours); // '0ч'
```

Второй аргумент `isIncreasePrecisionForZero` заменяет такой ноль на старший ненулевой разряд — полезно, чтобы короткие интервалы не схлопывались в «0ч»:

```ts
Duration.fromConfig({ minutes: 5 }).toFormat(DurationPrecisionFormat.hours, true); // '5м'
Duration.fromMilliseconds(42).toFormat(DurationPrecisionFormat.hours, true);       // '42мс'
Duration.empty.toFormat(DurationPrecisionFormat.hours, true);                      // '0мс'
```

`toString()` эквивалентен `toFormat()` со значениями по умолчанию, так что длительность можно подставлять в шаблонные строки.

Суффиксы разрядов — русские: `д`, `ч`, `м`, `с`, `мс` (см. `durationPrecisionFormatPostfix`).

### `toConfig()`

Раскладывает длительность по разрядам без переполнения. У отрицательной длительности знак получает каждый разряд:

```ts
Duration.fromMilliseconds(Duration.dayMs - 1).toConfig();
// { days: 0, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }
```

### `reformatTime(time)`

Форматирует `Date` или ISO-строку как `ЧЧ:ММ ДД.ММ.ГГ` в локали `ru-RU` и таймзоне окружения:

```ts
reformatTime(new Date(Date.UTC(2025, 0, 2, 3, 4))); // '03:04 02.01.25'
```

На неразбираемой строке бросает `RangeError`.

## Известные особенности

Поведение зафиксировано тестами как есть:

- Точность `days` всегда даёт `'0д'` — старший разряд отбрасывается вместе с остальными.
- Пропущенные старшие разряды оставляют ведущие пробелы: `' 1ч 2м'`.
- У отрицательной длительности знак повторяется у каждого разряда: `' -1ч -2м -3с'`.
- `divide(0)` даёт `Infinity`.

## Разработка

```bash
npm test              # прогон тестов
npm run test:watch    # watch-режим
npm run test:coverage # отчёт о покрытии
npm run build         # проверка типов и сборка
```
