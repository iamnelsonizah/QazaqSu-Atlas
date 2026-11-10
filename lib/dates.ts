// Date labels that do not depend on the browser's Kazakh locale data. Several
// browsers report kk-KZ as supported but format it as "M11 12" or fall back to
// English, so Kazakh names are spelled out here. Russian and English use Intl.
import type { Lang } from './types';

const KK_MONTHS_SHORT = ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'];
const KK_WEEKDAYS = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'];
const KK_WEEKDAYS_SHORT = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'];
const RELATIVE: Record<Lang, [string, string]> = { en: ['Today', 'Tomorrow'], kk: ['Бүгін', 'Ертең'], ru: ['Сегодня', 'Завтра'] };

/** Parse "YYYY-MM-DD" at local noon, so the day never shifts across time zones. */
function parse(iso: string): Date | null {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Nov" / "12 нояб." / "12 қар" */
export function dayMonth(iso: string, lang: Lang): string {
  const d = parse(iso);
  if (!d) return iso;
  if (lang === 'kk') return `${d.getDate()} ${KK_MONTHS_SHORT[d.getMonth()]}`;
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
}

/** Weekday name, long ("Thursday") or short ("Thu"). */
export function weekday(iso: string, lang: Lang, style: 'long' | 'short' = 'long'): string {
  const d = parse(iso);
  if (!d) return iso;
  if (lang === 'kk') return (style === 'long' ? KK_WEEKDAYS : KK_WEEKDAYS_SHORT)[d.getDay()];
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { weekday: style });
}

/** "Today", "Tomorrow", then the weekday, for a forecast list starting today. */
export function forecastDay(iso: string, index: number, lang: Lang): string {
  const label = index < 2 ? RELATIVE[lang][index] : weekday(iso, lang, 'long');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** 24-hour "14:05" for every language. */
export function clockTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
