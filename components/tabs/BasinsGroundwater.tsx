'use client';

import { useMemo, useState } from 'react';
import { BASINS, type Basin, type FloodPoint, type Lang, type LoadState } from '@/lib/types';
import { PLACES, nameOf } from '@/lib/places';
import { formatNumber, tr } from '@/lib/i18n';

type BasinFilter = Basin | 'all';
type SortMode = 'rise' | 'name';

interface BasinProps {
  flood: FloodPoint[] | null;
  state: LoadState;
  updatedAt: Date | null;
  refreshing: boolean;
  lang: Lang;
  onRefresh: () => void;
  onShowBasin: (basin: Basin) => void;
}

function formatFlow(value: number | null, lang: Lang) {
  return value == null || !Number.isFinite(value)
    ? tr(lang, 'No model value')
    : `${formatNumber(value, lang, { maximumFractionDigits: value < 10 ? 1 : 0 })} ${tr(lang, 'm³/s')}`;
}

function formatDate(date: string | undefined, lang: Lang) {
  if (!date) return tr(lang, 'date unavailable');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;

  const [, , monthText, dayText] = match;
  const month = Number(monthText) - 1;
  const day = Number(dayText);
  if (month < 0 || month > 11 || day < 1 || day > 31) return date;
  if (lang === 'en') {
    const parsed = new Date(`${date}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(parsed);
  }

  const months = lang === 'kk'
    ? ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел']
    : ['янв.', 'февр.', 'мар.', 'апр.', 'май', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
  return `${formatNumber(day, lang)} ${months[month]}`;
}

function FlowSparkline({ series, name, lang }: { series: FloodPoint['series']; name: string; lang: Lang }) {
  const values = series.map((point) => point.q);
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (valid.length < 2) return <span className="basin-no-value">{tr(lang, 'No series')}</span>;

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const span = max - min || 1;
  const xy = (index: number, value: number) => `${(index / Math.max(1, values.length - 1)) * 120},${29 - ((value - min) / span) * 24}`;
  const line = (start: number, end: number) => values
    .slice(start, end)
    .map((value, index) => value == null ? null : xy(index + start, value))
    .filter((point): point is string => point != null)
    .join(' ');

  return (
    <svg className="basin-sparkline" viewBox="0 0 120 34" role="img" aria-label={`${name}: ${tr(lang, 'seven past days and seven forecast days')}`}>
      <line x1="60" y1="2" x2="60" y2="32" className="basin-spark-divider" />
      <polyline points={line(0, 8)} className="basin-spark-past" />
      <polyline points={line(7, values.length)} className="basin-spark-forecast" />
    </svg>
  );
}

const CANALS_DATA = [
  {
    name: 'Kanysh Satpayev Canal',
    length: '458 km',
    capacity: '75 m³/s (2.2 km³/yr)',
    lift: '418 m lift via 22 pumping stations',
    path: 'Irtysh River (Aksu) → Ekibastuz → Temirtau / Karaganda → Astana Conduit',
    significance: 'Carries water to Karaganda and Astana for municipal and industrial use.',
  },
  {
    name: 'Great Almaty Canal (BAK)',
    length: '168 km',
    capacity: '30 m³/s',
    lift: 'Gravity flow along piedmont',
    path: 'Bartogay Reservoir (Chilik River) → Northern Almaty → Kurty Reservoir',
    significance: 'Supplies irrigation water and links reservoirs north of Almaty.',
  },
  {
    name: 'Koksaray Flood Regulator',
    length: '55 km',
    capacity: '500 m³/s bypass; 3.0 km³ basin',
    lift: 'Gravity diversion channel',
    path: 'Syr Darya (160 km downstream of Shardara) → Off-stream basin → Return channel',
    significance: 'Stores water diverted from the Syr Darya and helps reduce winter flood risk.',
  },
  {
    name: 'Arys–Turkistan Canal',
    length: '195 km',
    capacity: '45 m³/s',
    lift: 'Gravity canal',
    path: 'Arys River diversion dam → Bogen Reservoir → Turkistan historic oasis',
    significance: 'Supplies irrigation water in southern Kazakhstan.',
  },
];

const GLACIAL_DATA = [
  {
    name: 'Tuyuksu Glacier (WGMS 416)',
    elevation: '3,400–4,220 m',
    area: '2.6 km²',
    significance: 'Measured for long-term glacier change since 1956; meltwater contributes to Almaty’s summer supply.',
  },
  {
    name: 'Mynzhylki weather station',
    elevation: '3,017 m',
    area: 'Malaya Almatinka headwaters',
    significance: 'Measures weather and meltwater conditions in the Malaya Almatinka headwaters.',
  },
  {
    name: 'Khan Tengri–Northern Inylchek glacier area',
    elevation: '7,010 m peak',
    area: 'Central Tian Shan ice field',
    significance: 'Glacier-fed rivers in this area flow into the Bayankol and Ili systems.',
  },
];

export default function BasinsGroundwater({ flood, state, updatedAt, refreshing, onRefresh, onShowBasin, lang }: BasinProps) {
  const [basinFilter, setBasinFilter] = useState<BasinFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('rise');

  const groups = useMemo(() => BASINS
    .filter((basin) => basinFilter === 'all' || basin === basinFilter)
    .map((basin) => ({
      basin,
      points: (flood ?? [])
        .filter((point) => PLACES.find((place) => place.id === point.id)?.basin === basin)
        .sort((a, b) => sortMode === 'rise'
          ? (b.ratio ?? -Infinity) - (a.ratio ?? -Infinity)
          : (PLACES.find((place) => place.id === a.id) ? nameOf(PLACES.find((place) => place.id === a.id)!, lang) : a.name).localeCompare(PLACES.find((place) => place.id === b.id) ? nameOf(PLACES.find((place) => place.id === b.id)!, lang) : b.name, lang)),
    })), [basinFilter, flood, sortMode, lang]);

  return (
    <section className="page">
      <h2>{tr(lang, 'Basins and groundwater')}</h2>
      <p className="lede">{tr(lang, 'Kazakhstan has eight river basins. Several depend in part on rivers that cross the border from neighboring countries.')}</p>

      <h3 className="basin-section-title">{tr(lang, 'River flow by basin')}</h3>
      <p className="basin-source-note">{tr(lang, 'Daily GloFAS model estimates for 11 river locations, fetched from the live Open-Meteo Flood API. The model forecast is updated daily; these are not readings from Kazhydromet stations.')}</p>
      <div className="basin-live-panel">
        <div className="basin-live-toolbar">
          <label>
            {tr(lang, 'River basin')}
            <select value={basinFilter} onChange={(event) => setBasinFilter(event.target.value as BasinFilter)}>
              <option value="all">{tr(lang, 'All 8 basins')}</option>
              {BASINS.map((basin) => <option key={basin} value={basin}>{tr(lang, basin)}</option>)}
            </select>
          </label>
          <label>
            {tr(lang, 'Sort locations within each basin')}
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="rise">{tr(lang, 'Largest forecast rise')}</option>
              <option value="name">{tr(lang, 'River name')}</option>
            </select>
          </label>
          <button className="basin-refresh" type="button" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? tr(lang, 'Refreshing…') : tr(lang, 'Refresh data')}
          </button>
          <span className="basin-updated" aria-live="polite">
            {updatedAt ? tr(lang, 'Retrieved {time}').replace('{time}', updatedAt.toLocaleTimeString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })) : tr(lang, 'Waiting for live data')}
          </span>
        </div>

        {state === 'error' && (
          <div className="basin-live-error" role="status">
            {updatedAt ? tr(lang, 'Refresh failed. Showing the last successful response.') : tr(lang, 'Live flow data could not be loaded. Check the connection and try again.')}
          </div>
        )}
        {state === 'loading' && !flood && <p className="basin-live-loading">{tr(lang, 'Loading river-flow data…')}</p>}

        {flood && (
          <>
            <div className="basin-live-legend"><span><i className="basin-legend-line basin-legend-past" />{tr(lang, 'Past 7 days')}</span><span><i className="basin-legend-line basin-legend-forecast" />{tr(lang, 'Next 7 days')}</span></div>
            <div className="basin-live-groups">
              {groups.map(({ basin, points }) => (
                <section className="basin-live-group" key={basin}>
                  <header className="basin-live-group-head">
                    <div><h4>{tr(lang, basin)}</h4><span>{formatNumber(points.length, lang)} {tr(lang, points.length === 1 ? 'model location' : lang === 'ru' && points.length >= 2 && points.length <= 4 ? 'model locations 2–4' : 'model locations')}</span></div>
                    <button type="button" className="basin-map-button" onClick={() => onShowBasin(basin)}>{tr(lang, 'Show on map')} <span aria-hidden="true">↗</span></button>
                  </header>
                  {points.length ? (
                    <div className="basin-live-table-wrap">
                      <table className="basin-live-table">
                        <thead><tr><th>{tr(lang, 'Model point')}</th><th>{tr(lang, 'First forecast day')}</th><th>{tr(lang, '7-day peak')}</th><th>{tr(lang, 'Peak vs last week')}</th><th>{tr(lang, '14-day flow')}</th></tr></thead>
                        <tbody>
                          {points.map((point) => {
                            const peakDay = point.peak == null ? undefined : point.series.slice(7).find((day) => day.q === point.peak)?.date;
                            return (
                              <tr key={point.id}>
                                <td><strong>{PLACES.find((place) => place.id === point.id) ? nameOf(PLACES.find((place) => place.id === point.id)!, lang) : point.name}</strong></td>
                                <td><strong>{formatFlow(point.now, lang)}</strong><small>{formatDate(point.series[7]?.date, lang)}</small></td>
                                <td><strong>{formatFlow(point.peak, lang)}</strong><small>{formatDate(peakDay, lang)}</small></td>
                                <td>{point.ratio == null ? <span className="basin-no-value">{tr(lang, 'No comparison')}</span> : <strong className="basin-live-ratio">{formatNumber(point.ratio, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×</strong>}</td>
                                <td><FlowSparkline series={point.series} name={PLACES.find((place) => place.id === point.id) ? nameOf(PLACES.find((place) => place.id === point.id)!, lang) : point.name} lang={lang} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="basin-live-empty">{tr(lang, 'No model values returned for this basin.')}</p>}
                </section>
              ))}
            </div>
          </>
        )}

        <p className="basin-live-footnote">{tr(lang, 'Values are daily GloFAS simulations, not real-time sensor readings. The first value is the first forecast day; the comparison uses the next 7-day peak against the previous 7-day average. The model uses roughly 5 km grid cells, so a selected cell may not match the named river exactly; zero is a model value, not proof that the river is dry. See the')}{' '}
          <a href="https://open-meteo.com/en/docs/flood-api" target="_blank" rel="noreferrer">{tr(lang, 'Flood API documentation')}</a> {tr(lang, 'or the')}{' '}
          <a href="https://www.kazhydromet.kz/en/hydrological-monitoring/interaktivnaya-karta-gidrologicheskogo-monitoringa" target="_blank" rel="noreferrer">{tr(lang, 'official Kazhydromet station map')}</a> {tr(lang, 'for observed station readings.')}
        </p>
      </div>

      <h3 className="basin-section-title">{tr(lang, 'Canals and water projects')}</h3>
      <p className="basin-source-note">{tr(lang, 'Selected canals and projects that move, store or redirect water within Kazakhstan.')}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{tr(lang, 'Canal or project')}</th>
              <th>{tr(lang, 'Length')}</th>
              <th>{tr(lang, 'Capacity')}</th>
              <th>{tr(lang, 'Pumping or flow method')}</th>
              <th>{tr(lang, 'Route')}</th>
              <th>{tr(lang, 'Use')}</th>
            </tr>
          </thead>
          <tbody>
            {CANALS_DATA.map((c) => (
              <tr key={c.name}>
                <td><strong>{tr(lang, c.name)}</strong></td>
                <td className="mono">{tr(lang, c.length)}</td>
                <td className="mono">{tr(lang, c.capacity)}</td>
                <td>{tr(lang, c.lift)}</td>
                <td>{tr(lang, c.path)}</td>
                <td>{tr(lang, c.significance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="basin-section-title">{tr(lang, 'Glaciers and monitoring sites')}</h3>
      <p className="basin-source-note">
        {tr(lang, "Selected glacier and weather monitoring sites in Kazakhstan’s mountain regions.")}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{tr(lang, 'Site')}</th>
              <th>{tr(lang, 'Elevation')}</th>
              <th>{tr(lang, 'Area or basin')}</th>
              <th>{tr(lang, 'What is measured or supplied')}</th>
            </tr>
          </thead>
          <tbody>
            {GLACIAL_DATA.map((g) => (
              <tr key={g.name}>
                <td><strong>{tr(lang, g.name)}</strong></td>
                <td className="mono">{tr(lang, g.elevation)}</td>
                <td>{tr(lang, g.area)}</td>
                <td>{tr(lang, g.significance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
}
