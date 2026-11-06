'use client';

import { ALERT_LABEL, type AlertLevel, type FloodPoint, type Lang, type LoadState } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';
import { PLACES, nameOf } from '@/lib/places';

function Spark({ s, lang }: { s: FloodPoint['series']; lang: Lang }) {
  const v = s.map((x) => x.q).filter((x): x is number => x != null);
  if (v.length < 2) return <span className="muted">{tr(lang, 'no data')}</span>;
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  const pts = s.map((x, i) => (x.q == null ? null : `${(i / (s.length - 1)) * 120},${28 - ((x.q - min) / span) * 24}`)).filter(Boolean).join(' ');
  return (
    <svg width="120" height="30" viewBox="0 0 120 30" preserveAspectRatio="none" aria-label={tr(lang, 'River flow, 7 days past and 7 days forecast')}>
      <line x1="60" y1="0" x2="60" y2="30" stroke="var(--line)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const LEVEL_RANK: Record<AlertLevel, number> = { warning: 0, watch: 1, normal: 2, lowflow: 3, nodata: 4 };
const LOW_FLOW_NOTE = 'Flow is under 5 m³/s here, too low to rate. The model cell may sit off the main channel.';

function flow(v: number | null, lang: Lang) {
  if (v == null) return '–';
  return formatNumber(v, lang, { maximumFractionDigits: v < 10 ? 1 : 0 });
}
function ratioText(f: FloodPoint, lang: Lang) {
  if (f.ratio == null || f.level === 'lowflow') return '–';
  return `×${formatNumber(f.ratio, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FloodWatch({ flood, state, lang }: { flood: FloodPoint[] | null; state: LoadState; lang: Lang }) {
  return (
    <section className="page">
      <h2>{tr(lang, 'Flood watch')}</h2>
      <p className="lede">{tr(lang, 'Daily modelled river flow at 11 points on the Irtysh, Ishim, Tobol, Ural, Syr Darya, Ili, Nura and Talas. The Open-Meteo Flood API serves GloFAS estimates and forecasts, not Kazhydromet station readings. A point shows Watch when the forecast peak in the next 7 days is at least 1.4× last week\'s average, and Warning at 2× or more.')}</p>
      <div className="callout">
        {tr(lang, 'This is a model-based screening view, not an official warning. For warnings, check')}{' '}
        <a href="https://www.kazhydromet.kz" target="_blank" rel="noreferrer">Kazhydromet</a> {tr(lang, 'and the')}{' '}
        <a href="https://global-flood.emergency.copernicus.eu" target="_blank" rel="noreferrer">{tr(lang, 'GloFAS portal')}</a>.
      </div>
      {state === 'loading' && <p className="muted">{tr(lang, 'Loading river flow…')}</p>}
      {state === 'error' && <p className="error">{tr(lang, 'River flow could not be loaded. Check your connection and reload the page.')}</p>}
      {flood && (() => {
        const rows = [...flood].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || (b.ratio ?? 0) - (a.ratio ?? 0));
        const label = (f: FloodPoint) => {
          const place = PLACES.find((p) => p.id === f.id);
          return place ? nameOf(place, lang) : f.name;
        };
        return (<>
        <ul className="flood-cards">
          {rows.map((f) => (
            <li key={f.id} className={`flood-card lvl-${f.level}`}>
              <div className="flood-card-head">
                <strong>{label(f)}</strong>
                <span className={`pill ${f.level}`} title={f.level === 'lowflow' ? tr(lang, LOW_FLOW_NOTE) : undefined}>{tr(lang, ALERT_LABEL[f.level])}</span>
              </div>
              <dl>
                <div><dt>{tr(lang, 'First forecast day (m³/s)')}</dt><dd>{flow(f.now, lang)}</dd></div>
                <div><dt>{tr(lang, '7-day peak (m³/s)')}</dt><dd>{flow(f.peak, lang)}</dd></div>
                <div><dt>{tr(lang, 'Peak vs last week')}</dt><dd>{ratioText(f, lang)}</dd></div>
              </dl>
              <Spark s={f.series} lang={lang} />
              {f.level === 'lowflow' && <p className="flood-card-note">{tr(lang, LOW_FLOW_NOTE)}</p>}
            </li>
          ))}
        </ul>
        <div className="table-wrap flood-table">
          <table>
            <thead>
              <tr><th>{tr(lang, 'Point')}</th><th>{tr(lang, 'Status')}</th><th>{tr(lang, 'First forecast day (m³/s)')}</th><th>{tr(lang, '7-day peak (m³/s)')}</th><th>{tr(lang, 'Peak vs last week')}</th><th>{tr(lang, '14-day flow')}</th></tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id}>
                  <td>{label(f)}</td>
                  <td><span className={`pill ${f.level}`} title={f.level === 'lowflow' ? tr(lang, LOW_FLOW_NOTE) : undefined}>{tr(lang, ALERT_LABEL[f.level])}</span></td>
                  <td>{flow(f.now, lang)}</td>
                  <td>{flow(f.peak, lang)}</td>
                  <td>{ratioText(f, lang)}</td>
                  <td><Spark s={f.series} lang={lang} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.some((f) => f.level === 'lowflow') && <p className="muted flood-footnote">{tr(lang, 'Low flow')}: {tr(lang, LOW_FLOW_NOTE)}</p>}
        </>);
      })()}
    </section>
  );
}
