import { DurationPrecisionFormat } from '../model/duration-precision-format.ts';
import { type DurationConfig } from '../model/duration-config.ts';

export const durationPrecisionFormatOrder: readonly DurationPrecisionFormat[] = Object.freeze([
  DurationPrecisionFormat.days,
  DurationPrecisionFormat.hours,
  DurationPrecisionFormat.minutes,
  DurationPrecisionFormat.seconds,
  DurationPrecisionFormat.milliseconds,
]);

export const durationPrecisionFormatToDurationKey =
  Object.freeze(new Map<DurationPrecisionFormat, keyof DurationConfig>([
    [DurationPrecisionFormat.days, 'days'],
    [DurationPrecisionFormat.hours, 'hours'],
    [DurationPrecisionFormat.minutes, 'minutes'],
    [DurationPrecisionFormat.seconds, 'seconds'],
    [DurationPrecisionFormat.milliseconds, 'milliseconds'],
  ]));

export const durationPrecisionFormatPostfix =
  Object.freeze(new Map<DurationPrecisionFormat, string>([
    [DurationPrecisionFormat.days, 'д'],
    [DurationPrecisionFormat.hours, 'ч'],
    [DurationPrecisionFormat.minutes, 'м'],
    [DurationPrecisionFormat.seconds, 'с'],
    [DurationPrecisionFormat.milliseconds, 'мс'],
  ]));