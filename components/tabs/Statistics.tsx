'use client';

import { PLACES, TYPE_ORDER } from '@/lib/places';
import type { Lang, PlaceType } from '@/lib/types';
import { REGIONS } from '@/lib/places';
import { nameOf, TYPE_META } from '@/lib/places';
import { formatNumber, tr } from '@/lib/i18n';

function Bars({ title, unit, type, lang }: { title: string; unit: string; type: PlaceType; lang: Lang }) {
  const items = PLACES.filter((p) => p.type === type && (p.lengthKm != null || p.size != null))
    .sort((a, b) => ((b.lengthKm ?? b.size!) - (a.lengthKm ?? a.size!)))
    .slice(0, 8);
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => i.lengthKm ?? i.size!));
  return (
    <div className="stat-card">
      <h3>{tr(lang, title)}</h3>
      {items.map((i) => {
        const val = i.lengthKm ?? i.size!;
        return (
          <div className="hbar" key={i.id}>
            <span className="hbar-name">{nameOf(i, lang)}</span>
            <span className="hbar-track">
              <span
                style={{
                  width: `${Math.max(3, (Math.log10(val + 1) / Math.log10(max + 1)) * 100)}%`,
                  background: TYPE_META[type].color,
                }}
              />
            </span>
            <span className="hbar-val">{formatNumber(val, lang)} {tr(lang, unit)}</span>
          </div>
        );
      })}
      <p className="muted">{tr(lang, 'Bar length scaled logarithmically for comparison.')}</p>
    </div>
  );
}

const BASIN_DEPENDENCE_BARS = [
  { name: 'Aral-Syrdarya', ratio: 78.9, val: '14.6 / 18.5 km³', color: '#dc2626' },
  { name: 'Zhayik-Caspian (Ural)', ratio: 78.9, val: '7.5 / 9.5 km³', color: '#dc2626' },
  { name: 'Shu-Talas', ratio: 73.8, val: '3.1 / 4.2 km³', color: '#dc2626' },
  { name: 'Balkhash-Alakol', ratio: 44.2, val: '12.3 / 27.8 km³', color: '#d97706' },
  { name: 'Tobyl-Torgay', ratio: 38.1, val: '0.8 / 2.1 km³', color: '#d97706' },
  { name: 'Ertis (Irtysh)', ratio: 28.1, val: '9.5 / 33.8 km³', color: '#16a34a' },
  { name: 'Esil (Ishim)', ratio: 0.0, val: '0.0 / 2.6 km³ (Domestic)', color: '#0284c7' },
  { name: 'Nura-Sarysu', ratio: 0.0, val: '0.0 / 1.5 km³ (Domestic)', color: '#0284c7' },
];

export default function Statistics({ lang }: { lang: Lang }) {
  const byType = TYPE_ORDER.map((t) => ({ t, n: PLACES.filter((p) => p.type === t).length })).filter((x) => x.n > 0);
  const byRegion = REGIONS.map((r) => ({ r, n: PLACES.filter((p) => p.region === r).length })).sort((a, b) => b.n - a.n).slice(0, 8);
  const maxR = Math.max(...byRegion.map((x) => x.n));

  return (
    <section className="page">
      <h2>{tr(lang, 'National Water Statistics')}</h2>
      <p className="lede">{tr(lang, 'Verified hydrological figures compiled from the Ministry of Water Resources and Irrigation of the Republic of Kazakhstan, Global Dam Watch, and the World Glacier Monitoring Service.')}</p>

      <div className="stat-grid">
        {/* Transboundary Inflow Dependence Bar */}
        <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <h3>{tr(lang, 'Transboundary Inflow Dependence Index by River Basin')}</h3>
          <p className="card-sub" style={{ marginBottom: 12 }}>
            {tr(lang, "Percentage of total annual river runoff originating outside Kazakhstan's borders. National average:")} <strong>{formatNumber(46.7, lang, { maximumFractionDigits: 1 })}%</strong> ({tr(lang, '47.8 of 102.3 km³/yr')}).
          </p>
          {BASIN_DEPENDENCE_BARS.map((b) => (
            <div className="hbar hbar-basin" key={b.name}>
              <span className="hbar-name" style={{ fontWeight: 600 }}>{tr(lang, b.name)}</span>
              <span className="hbar-track">
                <span style={{ width: `${Math.max(b.ratio > 0 ? 4 : 0, b.ratio)}%`, background: b.color }} />
              </span>
              <span className="hbar-val" style={{ textAlign: 'right' }}>
                <strong>{formatNumber(b.ratio, lang, { maximumFractionDigits: 1 })}%</strong> <span style={{ fontSize: 11, color: 'var(--muted)' }}>({tr(lang, b.val)})</span>
              </span>
            </div>
          ))}
        </div>

        <div className="stat-card">
          <h3>{tr(lang, 'Records by type')}</h3>
          {byType.map(({ t, n }) => (
            <div className="hbar" key={t}>
              <span className="hbar-name">{tr(lang, TYPE_META[t].plural)}</span>
              <span className="hbar-track">
                <span style={{ width: `${Math.min(100, (n / PLACES.length) * 100 * 2.5)}%`, background: TYPE_META[t].color }} />
              </span>
              <span className="hbar-val">{n}</span>
            </div>
          ))}
        </div>

        <Bars title="Largest reservoirs by capacity" unit="km³" type="dam" lang={lang} />
        <Bars title="Largest lakes and inland seas" unit="km²" type="lake" lang={lang} />
        <Bars title="Longest river corridors" unit="km" type="river" lang={lang} />
        <Bars title="Strategic inter-basin transfer canals" unit="km" type="canal" lang={lang} />

        <div className="stat-card">
          <h3>{tr(lang, 'Regions with the most water assets')}</h3>
          {byRegion.map((x) => (
            <div className="hbar" key={x.r}>
              <span className="hbar-name">{tr(lang, x.r)}</span>
              <span className="hbar-track">
                <span style={{ width: `${(x.n / maxR) * 100}%`, background: 'var(--accent)' }} />
              </span>
              <span className="hbar-val">{formatNumber(x.n, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
