export const DurationPrecisionFormat = Object.freeze({
  days: 'days',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds',
  milliseconds: 'milliseconds'
} as const);

export type DurationPrecisionFormat =
  typeof DurationPrecisionFormat[keyof typeof DurationPrecisionFormat];
