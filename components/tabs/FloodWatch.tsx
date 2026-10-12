'use client';

import type { FloodPoint, Lang, LoadState } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';
import { PLACES, nameOf } from '@/lib/places';

function Spark({ s, lang }: { s: FloodPoint['series']; lang: Lang }) {
  const v = s.map((x) => x.q).filter((x): x is number => x != null);
  if (v.length < 2) return <span className="muted">{tr(lang, 'no data')}</span>;
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  const pts = s.map((x, i) => (x.q == null ? null : `${(i / (s.length - 1)) * 120},${28 - ((x.q - min) / span) * 24}`)).filter(Boolean).join(' ');
  return (
    <svg width="120" height="30" viewBox="0 0 120 30" aria-label={tr(lang, 'River flow, 7 days past and 7 days forecast')}>
      <line x1="60" y1="0" x2="60" y2="30" stroke="var(--line)" strokeDasharray="2 2" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
    </svg>
  );
}

const LEVEL: Record<string, string> = { normal: 'Normal', watch: 'Watch', warning: 'Warning', nodata: 'No data' };

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
      {flood && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{tr(lang, 'Point')}</th><th>{tr(lang, 'Status')}</th><th>{tr(lang, 'First forecast day (m³/s)')}</th><th>{tr(lang, '7-day peak (m³/s)')}</th><th>{tr(lang, 'Peak vs last week')}</th><th>{tr(lang, '14-day flow')}</th></tr>
            </thead>
            <tbody>
              {[...flood].sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0)).map((f) => (
                <tr key={f.id}>
                  <td>{PLACES.find((place) => place.id === f.id) ? nameOf(PLACES.find((place) => place.id === f.id)!, lang) : f.name}</td>
                  <td><span className={`pill ${f.level}`}>{tr(lang, LEVEL[f.level])}</span></td>
                  <td>{f.now != null ? formatNumber(f.now, lang, { maximumFractionDigits: 0 }) : '–'}</td>
                  <td>{f.peak != null ? formatNumber(f.peak, lang, { maximumFractionDigits: 0 }) : '–'}</td>
                  <td>{f.ratio != null ? `×${formatNumber(f.ratio, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '–'}</td>
                  <td><Spark s={f.series} lang={lang} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
