# duration

An immutable duration class and time formatting helper.
Zero dependencies, ESM + CJS, TypeScript types included.

*Читать на [русском](./README.md).*

## Install

```bash
npm install duration
```

## Quick start

```ts
import { Duration, DurationPrecisionFormat, reformatTime } from 'duration';

const d = Duration.fromConfig({ days: 2, hours: 3, minutes: 4 });

d.toFormat();                                    // '2д'
d.toFormat(DurationPrecisionFormat.minutes);     // '2д 3ч'
d.toConfig();                                    // { days: 2, hours: 3, minutes: 4, seconds: 0, milliseconds: 0 }
d.valueOf();                                     // 183840000

reformatTime('2025-09-24T14:30:00Z');            // '14:30 24.09.25'
```

## Creating a duration

| Method | Description |
| --- | --- |
| `Duration.fromMilliseconds(ms)` | From a raw millisecond count. |
| `Duration.fromConfig(config)` | From `{ days, hours, minutes, seconds, milliseconds }`. Missing fields default to zero, overflow is normalized (`{ hours: 25 }` → 1 day 1 hour), negative fields are allowed. |
| `Duration.fromDates(start, end)` | The difference between two dates. Negative when `end` precedes `start`. |
| `Duration.empty` | A zero-length duration. |

Conversion constants: `Duration.secondMs`, `minuteMs`, `hourMs`, `dayMs`.

## Arithmetic

Instances are `Object.freeze`d, so **every operation returns a new object** and never mutates the receiver:

```ts
const hour = Duration.fromConfig({ hours: 1 });

hour.add(Duration.fromConfig({ minutes: 30 }));   // 1h 30m
hour.subtract(Duration.fromConfig({ hours: 2 })); // -1h
hour.multiply(3);                                 // 3h
hour.divide(4);                                   // 15m
hour.inverse();                                   // -1h
hour.clone();                                     // equal value, different object
hour.valueOf();                                   // 3600000 — hour is unchanged
```

`addTo(date)` shifts a date by the duration and returns a **new** `Date`, leaving the argument untouched:

```ts
Duration.fromConfig({ days: 1 }).addTo(new Date('2025-01-31T12:00:00Z'));
// 2025-02-01T12:00:00.000Z
```

## Comparison

`valueOf()` returns milliseconds, so instances work with the native operators:

```ts
Duration.fromConfig({ hours: 1 }) < Duration.fromConfig({ hours: 2 }); // true
Number(a) + Number(b);                                                 // sum in ms
```

## Formatting

### `toFormat(precisionFormat?, isIncreasePrecisionForZero?)`

Builds a string from the units **strictly coarser** than the given precision. The default precision is `hours`, which prints days only:

```ts
const d = Duration.fromConfig({ days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 });

d.toFormat(DurationPrecisionFormat.hours);        // '2д'
d.toFormat(DurationPrecisionFormat.minutes);      // '2д 3ч'
d.toFormat(DurationPrecisionFormat.seconds);      // '2д 3ч 4м'
d.toFormat(DurationPrecisionFormat.milliseconds); // '2д 3ч 4м 5с'
```

When every coarser unit is empty, a zero is printed in the requested unit:

```ts
Duration.fromConfig({ minutes: 5 }).toFormat(DurationPrecisionFormat.hours); // '0ч'
```

The second argument, `isIncreasePrecisionForZero`, replaces that zero with the largest non-empty unit — useful so short intervals don't collapse into "0ч":

```ts
Duration.fromConfig({ minutes: 5 }).toFormat(DurationPrecisionFormat.hours, true); // '5м'
Duration.fromMilliseconds(42).toFormat(DurationPrecisionFormat.hours, true);       // '42мс'
Duration.empty.toFormat(DurationPrecisionFormat.hours, true);                      // '0мс'
```

`toString()` is equivalent to `toFormat()` with its defaults, so a duration can be dropped straight into a template literal.

Unit suffixes are Russian: `д`, `ч`, `м`, `с`, `мс` (see `durationPrecisionFormatPostfix`).

### `toConfig()`

Breaks a duration into units without overflow. For a negative duration every unit carries the sign:

```ts
Duration.fromMilliseconds(Duration.dayMs - 1).toConfig();
// { days: 0, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }
```

### `reformatTime(time)`

Formats a `Date` or ISO string as `HH:MM DD.MM.YY` using the `ru-RU` locale and the ambient time zone:

```ts
reformatTime(new Date(Date.UTC(2025, 0, 2, 3, 4))); // '03:04 02.01.25'
```

Throws `RangeError` on an unparseable string.

## Known quirks

Current behaviour, pinned by tests as-is:

- The `days` precision always yields `'0д'` — the coarsest unit is dropped along with the rest.
- Absent leading units leave leading spaces: `' 1ч 2м'`.
- A negative duration repeats the sign on every unit: `' -1ч -2м -3с'`.
- `divide(0)` yields `Infinity`.

## Development

```bash
npm test              # run tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
npm run build         # typecheck and build
```
