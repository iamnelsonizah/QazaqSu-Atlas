'use client';

import { ALERT_LABEL, type AlertLevel, type FloodPoint, type Lang, type LoadState } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';
import { PLACES, nameOf } from '@/lib/places';
import FlowChart, { FlowLegend } from '../FlowChart';
import Icon from '../Icon';

const LEVEL_RANK: Record<AlertLevel, number> = { warning: 0, watch: 1, normal: 2, lowflow: 3, nodata: 4 };
const LOW_FLOW_NOTE = 'Flow is under 5 m³/s here, too low for a meaningful flood signal.';

function flow(v: number | null, lang: Lang) {
  if (v == null) return '–';
  return formatNumber(v, lang, { maximumFractionDigits: v < 10 ? 1 : 0 });
}
function ratioText(f: FloodPoint, lang: Lang) {
  if (f.ratio == null || f.level === 'lowflow') return '–';
  return `×${formatNumber(f.ratio, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  flood: FloodPoint[] | null;
  state: LoadState;
  lang: Lang;
  onShowPlace: (id: string) => void;
}

export default function FloodWatch({ flood, state, lang, onShowPlace }: Props) {
  const rows = flood ? [...flood].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || (b.ratio ?? 0) - (a.ratio ?? 0)) : [];
  const label = (f: FloodPoint) => {
    const place = PLACES.find((p) => p.id === f.id);
    return place ? nameOf(place, lang) : f.name;
  };
  const counts = rows.reduce<Record<string, number>>((c, f) => ({ ...c, [f.level]: (c[f.level] ?? 0) + 1 }), {});

  return (
    <section className="page page-wide">
      <h2>{tr(lang, 'Flood watch')}</h2>
      <p className="lede">{tr(lang, 'Daily modelled river flow at 11 points on the Irtysh, Ishim, Tobol, Ural, Syr Darya, Ili, Nura and Talas. The Open-Meteo Flood API serves GloFAS estimates and forecasts, not Kazhydromet station readings. A point shows Watch when the forecast peak in the next 7 days is at least 1.4× last week\'s average, and Warning at 2× or more.')}</p>
      <div className="callout">
        {tr(lang, 'This is a model-based screening view, not an official warning. For warnings, check')}{' '}
        <a href="https://www.kazhydromet.kz" target="_blank" rel="noreferrer">Kazhydromet</a> {tr(lang, 'and the')}{' '}
        <a href="https://global-flood.emergency.copernicus.eu" target="_blank" rel="noreferrer">{tr(lang, 'GloFAS portal')}</a>.
      </div>
      {state === 'loading' && !flood && <p className="muted">{tr(lang, 'Loading river flow…')}</p>}
      {state === 'error' && <p className="error">{tr(lang, 'River flow could not be loaded. Check your connection and reload the page.')}</p>}
      {rows.length > 0 && (
        <>
          <div className="flood-summary" role="status">
            {(['warning', 'watch', 'normal', 'lowflow', 'nodata'] as AlertLevel[]).filter((l) => counts[l]).map((l) => (
              <span key={l} className={`pill ${l}`}>{counts[l]} · {tr(lang, ALERT_LABEL[l])}</span>
            ))}
          </div>
          <div className="flood-legend">
            <span>{tr(lang, 'Last 30 days and 7-day forecast')}</span>
            <FlowLegend lang={lang} />
          </div>
          <ul className="flood-cards">
            {rows.map((f) => (
              <li key={f.id} className={`flood-card lvl-${f.level}`}>
                <div className="flood-card-head">
                  <strong>{label(f)}</strong>
                  <span className={`pill ${f.level}`}>{tr(lang, ALERT_LABEL[f.level])}</span>
                </div>
                <dl>
                  <div><dt>{tr(lang, 'Flow now')}</dt><dd>{flow(f.now, lang)}<small> {tr(lang, 'm³/s')}</small></dd></div>
                  <div><dt>{tr(lang, '7-day peak')}</dt><dd>{flow(f.peak, lang)}<small> {tr(lang, 'm³/s')}</small></dd></div>
                  <div><dt>{tr(lang, 'Peak vs last week')}</dt><dd>{ratioText(f, lang)}</dd></div>
                </dl>
                <FlowChart
                  days={f.history}
                  todayIndex={f.todayIndex}
                  base={f.level === 'lowflow' ? null : f.base}
                  label={label(f)}
                  lang={lang}
                  height={130}
                  legend={false}
                />
                {f.level === 'lowflow' && <p className="flood-card-note">{tr(lang, LOW_FLOW_NOTE)}</p>}
                <button type="button" className="flood-card-map" onClick={() => onShowPlace(f.id)}>
                  {tr(lang, 'Show on map')} <Icon name="arrowRight" size={13} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
