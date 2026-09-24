import type { DurationConfig } from './model/duration-config.ts';
import { DurationPrecisionFormat } from './model/duration-precision-format.ts';
import {
  durationPrecisionFormatOrder,
  durationPrecisionFormatPostfix,
  durationPrecisionFormatToDurationKey,
} from './format/duration-precision-format.constants.ts';

export class Duration {

  public static readonly secondMs = 1000;
  public static readonly minuteMs = 60 * Duration.secondMs;
  public static readonly hourMs = 60 * Duration.minuteMs;
  public static readonly dayMs = 24 * Duration.hourMs;

  public static readonly empty = new Duration(0);

  public static fromMilliseconds(milliseconds: number): Duration {
    return new Duration(milliseconds);
  }

  public static fromConfig(duration: DurationConfig): Duration {
    return new Duration(Duration.convertConfigToMs(duration));
  }

  public static fromDates(start: Date, end: Date): Duration {
    return new Duration(end.getTime() - start.getTime());
  }

  private static convertConfigToMs(duration: DurationConfig): number {
    const {
      days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0,
      milliseconds = 0,
    } = duration;
    const date = new Date(0);
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() + hours);
    date.setMinutes(date.getMinutes() + minutes);
    date.setSeconds(date.getSeconds() + seconds);
    date.setMilliseconds(date.getMilliseconds() + milliseconds);
    return date.getTime();
  }

  private static convertMsToConfig(durationMilliseconds: number): DurationConfig {
    const sign = durationMilliseconds < 0 ? -1 : 1;
    const durationMs: number = Math.abs(durationMilliseconds);

    const days = Math.floor(durationMs / Duration.dayMs);
    const remainMsInDay = durationMs - days * Duration.dayMs;
    const hours = Math.floor(remainMsInDay / Duration.hourMs);
    const remainMsInHour = remainMsInDay - hours * Duration.hourMs;
    const minutes = Math.floor(remainMsInHour / Duration.minuteMs);
    const remainMsInMinute = remainMsInHour - minutes * Duration.minuteMs;
    const seconds = Math.floor(remainMsInMinute / Duration.secondMs);
    const milliseconds = remainMsInMinute - seconds * Duration.secondMs;

    return {
      milliseconds: Duration.normalizeZero(sign * milliseconds),
      seconds: Duration.normalizeZero(sign * seconds),
      minutes: Duration.normalizeZero(sign * minutes),
      hours: Duration.normalizeZero(sign * hours),
      days: Duration.normalizeZero(sign * days),
    };
  }

  /**
   * Normalize -0 value to 0 value
   */
  private static normalizeZero(value: number): number {
    return value === 0 ? 0 : value;
  }


  protected readonly durationMs: number;

  public constructor(milliseconds: number) {
    this.durationMs = milliseconds;
    Object.freeze(this);
  }

  public add(that: Duration): Duration {
    return new Duration(this.durationMs + that.durationMs);
  }

  public subtract(that: Duration): Duration {
    return new Duration(this.durationMs - that.durationMs);
  }

  public addTo(date: Date): Date {
    const newDate = new Date(date);
    newDate.setTime(newDate.getTime() + this.durationMs);
    return newDate;
  }

  public multiply(times: number): Duration {
    return new Duration(this.durationMs * times);
  }

  public divide(times: number): Duration {
    return this.multiply(1 / times);
  }

  public inverse(): Duration {
    return this.multiply(-1);
  }

  public clone(): Duration {
    return new Duration(this.durationMs);
  }

  public valueOf(): number {
    return this.durationMs;
  }

  public toString(): string {
    return this.toFormat();
  }

  public toConfig(): DurationConfig {
    return Duration.convertMsToConfig(this.durationMs);
  }

  public toFormat(
    precisionFormat: DurationPrecisionFormat = DurationPrecisionFormat.hours,
    isIncreasePrecisionForZero: boolean = false,
  ): string {
    const splitPrecisionIdx = durationPrecisionFormatOrder.indexOf(precisionFormat);

    const mainPrecision = durationPrecisionFormatOrder.slice(0, splitPrecisionIdx);
    const mainFormatParts = this.getFormatParts(mainPrecision);
    const isMainHaveSomePart = mainFormatParts.some(part => part !== undefined);

    if (isMainHaveSomePart) { // отобразить основную точность если есть значение
      return mainFormatParts.join(' ');
    }

    if (!isIncreasePrecisionForZero) { // отобразить 0 если не включена повышенная точность
      const precisionFormatPostfix = durationPrecisionFormatPostfix.get(precisionFormat);
      return `0${precisionFormatPostfix}`;
    }

    const restPrecision = durationPrecisionFormatOrder.slice(splitPrecisionIdx);
    const restFormatParts = this.getFormatParts(restPrecision);
    const foundFirstRestPart = restFormatParts.find((part: string | undefined) => part !== undefined)

    if (foundFirstRestPart) { // отобразить наибольший разряд повышенной точности
      return foundFirstRestPart;
    }

    const totalMsValue = this.valueOf(); // отобразить значение в милисекундах
    const msFormatPostfix = durationPrecisionFormatPostfix.get(DurationPrecisionFormat.milliseconds);
    return `${totalMsValue}${msFormatPostfix}`;
  }

  private getFormatParts(
    durationPrecisionFormats: DurationPrecisionFormat[],
  ): Array<string | undefined> {
    const durationConfig = this.toConfig();

    return durationPrecisionFormats
      .reduce((formatted: Array<string | undefined>, format: DurationPrecisionFormat): Array<string | undefined> => {
        const fieldKey: keyof DurationConfig = durationPrecisionFormatToDurationKey.get(format)!;
        const fieldValue: number | undefined = durationConfig[fieldKey];
        const formatPostfix = durationPrecisionFormatPostfix.get(format);
        const formattedValue: string | undefined = fieldValue
          ? `${fieldValue}${formatPostfix}`
          : undefined;
        return [...formatted, formattedValue];
      }, []);
  }

}
