export const reformatTime = (time: string | Date): string => {
  const date = new Date(time);
  const locales = 'ru-RU';

  const timeFormatted = new Intl.DateTimeFormat(locales, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  const dateFormatted = new Intl.DateTimeFormat(locales, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return `${timeFormatted} ${dateFormatted}`;
};
