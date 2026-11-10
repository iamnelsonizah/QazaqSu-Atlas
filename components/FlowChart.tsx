'use client';

import type { FlowDay, Lang } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';
import { dayMonth } from '@/lib/dates';

export const WATCH_RATIO = 1.4;
export const WARNING_RATIO = 2;

interface Props {
  days: FlowDay[];
  todayIndex: number;
  lang: Lang;
  /** Mean flow of the 7 days before today. When given, Watch and Warning lines are drawn. */
  base?: number | null;
  /** Accessible name, e.g. the river and place. */
  label: string;
  forecastLabel?: string;
  height?: number;
  /** Set false when one shared <FlowLegend> is shown for several charts. */
  legend?: boolean;
}

export function FlowLegend({ lang, forecastLabel = 'Forecast', band = true, thresholds = true }: { lang: Lang; forecastLabel?: string; band?: boolean; thresholds?: boolean }) {
  return (
    <div className="fc-legend">
      <span><i className="fc-key past" />{tr(lang, 'Modelled flow')}</span>
      <span><i className="fc-key future" />{tr(lang, forecastLabel)}</span>
      {band && <span><i className="fc-key band" />{tr(lang, 'Forecast range (25–75%)')}</span>}
      {thresholds && <span><i className="fc-key watch" />{tr(lang, 'Watch')} ×{formatNumber(WATCH_RATIO, lang)}</span>}
      {thresholds && <span><i className="fc-key warning" />{tr(lang, 'Warning')} ×{formatNumber(WARNING_RATIO, lang)}</span>}
    </div>
  );
}

const W = 360;
const PAD = { l: 38, r: 34, t: 14, b: 22 };

function niceTop(v: number) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * mag >= v) ?? 10;
  return step * mag;
}

function linePath(points: [number, number][]) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

export default function FlowChart({ days, todayIndex, lang, base, label, forecastLabel = 'Forecast', height = 150, legend = true }: Props) {
  const n = days.length;
  const values = days.flatMap((d) => [d.q, d.p75]).filter((v): v is number => v != null && Number.isFinite(v));
  if (n < 2 || values.length < 2) return <p className="muted flow-chart-empty">{tr(lang, 'no data')}</p>;

  const watch = base != null && base > 0 ? base * WATCH_RATIO : null;
  const warning = base != null && base > 0 ? base * WARNING_RATIO : null;
  const top = niceTop(Math.max(...values, warning ?? 0) * 1.05);
  const plotW = W - PAD.l - PAD.r;
  const plotH = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (i / (n - 1)) * plotW;
  const y = (v: number) => PAD.t + plotH - (Math.max(0, Math.min(top, v)) / top) * plotH;
  const today = Math.min(Math.max(0, todayIndex), n - 1);

  const past: [number, number][] = [];
  const future: [number, number][] = [];
  days.forEach((d, i) => {
    if (d.q == null) return;
    if (i <= today) past.push([x(i), y(d.q)]);
    if (i >= today) future.push([x(i), y(d.q)]);
  });
  const band = days
    .map((d, i) => (i >= today && d.p25 != null && d.p75 != null ? { i, lo: d.p25, hi: d.p75 } : null))
    .filter((b): b is { i: number; lo: number; hi: number } => b != null);
  const bandPath = band.length > 1
    ? `${linePath(band.map((b) => [x(b.i), y(b.hi)]))} ${band.slice().reverse().map((b) => `L${x(b.i).toFixed(1)} ${y(b.lo).toFixed(1)}`).join(' ')} Z`
    : '';

  let peakIdx = -1;
  days.forEach((d, i) => {
    if (i > today && d.q != null && (peakIdx < 0 || d.q > (days[peakIdx].q ?? -1))) peakIdx = i;
  });
  const peak = peakIdx >= 0 ? days[peakIdx].q! : null;

  const fmt = (v: number) => formatNumber(v, lang, { maximumFractionDigits: v < 10 ? 1 : 0 });
  const day = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : dayMonth(iso, lang);
  };
  const summary = `${label}. ${tr(lang, 'Flow now')}: ${days[today].q != null ? fmt(days[today].q!) : '–'} ${tr(lang, 'm³/s')}${peak != null ? `, ${tr(lang, '7-day peak')}: ${fmt(peak)} ${tr(lang, 'm³/s')}` : ''}.`;

  return (
    <figure className="flow-chart">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={summary}>
        {[top, top / 2].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="fc-grid" />
            <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fc-tick">{fmt(v)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} className="fc-axis" />
        <text x={PAD.l - 6} y={y(0) + 3} textAnchor="end" className="fc-tick">0</text>

        {bandPath && <path d={bandPath} className="fc-band" />}

        {warning != null && (
          <g className="fc-threshold warning">
            <line x1={PAD.l} x2={W - PAD.r} y1={y(warning)} y2={y(warning)} />
            <text x={W - PAD.r + 4} y={y(warning) + 3}>×{formatNumber(WARNING_RATIO, lang)}</text>
          </g>
        )}
        {watch != null && (
          <g className="fc-threshold watch">
            <line x1={PAD.l} x2={W - PAD.r} y1={y(watch)} y2={y(watch)} />
            <text x={W - PAD.r + 4} y={y(watch) + 3 + (warning != null && y(watch) - y(warning) < 11 ? 5 : 0)}>×{formatNumber(WATCH_RATIO, lang)}</text>
          </g>
        )}

        <line x1={x(today)} x2={x(today)} y1={PAD.t} y2={PAD.t + plotH} className="fc-today" />
        {past.length > 1 && <path d={linePath(past)} className="fc-past" />}
        {future.length > 1 && <path d={linePath(future)} className="fc-future" />}
        {peak != null && (
          <g className="fc-peak">
            <circle cx={x(peakIdx)} cy={y(peak)} r="3" />
            <text x={x(peakIdx) - 5} y={Math.max(PAD.t + 8, y(peak) - 6)} textAnchor="end">{fmt(peak)}</text>
          </g>
        )}

        <text x={PAD.l} y={height - 6} className="fc-date">{day(days[0].date)}</text>
        <text x={x(today)} y={height - 6} textAnchor={x(n - 1) - x(today) > 60 ? 'middle' : 'end'} className="fc-date fc-date-today">{tr(lang, 'today')}</text>
        {x(n - 1) - x(today) > 60 && <text x={W - PAD.r} y={height - 6} textAnchor="end" className="fc-date">{day(days[n - 1].date)}</text>}
      </svg>
      {legend && <figcaption><FlowLegend lang={lang} forecastLabel={forecastLabel} band={!!bandPath} thresholds={watch != null} /></figcaption>}
    </figure>
  );
}
