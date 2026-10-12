'use client';

import { useState } from 'react';
import type { Lang, LoadState, WeatherPoint } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';

export default function RainHarvest({ weather, state, lang }: { weather: WeatherPoint[] | null; state: LoadState; lang: Lang }) {
  const [roof, setRoof] = useState(80);
  const [annual, setAnnual] = useState(300);
  const [eff, setEff] = useState(80);
  const litres = roof * annual * (eff / 100); // 1 mm on 1 m² = 1 litre
  return (
    <section className="page">
      <h2>{tr(lang, 'Rain and harvesting')}</h2>
      <p className="lede">{tr(lang, 'Rain recorded yesterday and forecast for the next 3 days in 19 cities, from Open-Meteo.')}</p>
      {state === 'loading' && <p className="muted">{tr(lang, 'Loading weather…')}</p>}
      {state === 'error' && <p className="error">{tr(lang, 'Weather could not be loaded. Check your connection and reload the page.')}</p>}
      {weather && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{tr(lang, 'City')}</th><th>{tr(lang, 'Rain yesterday (mm)')}</th><th>{tr(lang, 'Rain, next 3 days (mm)')}</th><th>{tr(lang, 'Max temperature today (°C)')}</th></tr></thead>
            <tbody>
              {[...weather].sort((a, b) => b.next3 - a.next3).map((w) => (
                <tr key={w.name}>
                  <td>{tr(lang, w.name)}</td>
                  <td>{formatNumber(w.yesterday, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td>
                    <span className="bar" style={{ width: Math.min(120, w.next3 * 6) }} /> {formatNumber(w.next3, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td>{w.tmax != null ? formatNumber(w.tmax, lang, { maximumFractionDigits: 0 }) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>{tr(lang, 'How much could a roof collect?')}</h3>
      <p className="muted">{tr(lang, 'Each millimetre of rain on one square metre gives one litre. Enter your roof size and the average yearly rain for your town.')}</p>
      <div className="calc">
        <label>{tr(lang, 'Roof area (m²)')}<input type="number" min={0} value={roof} onChange={(e) => setRoof(+e.target.value)} /></label>
        <label>{tr(lang, 'Rain per year (mm)')}<input type="number" min={0} value={annual} onChange={(e) => setAnnual(+e.target.value)} /></label>
        <label>{tr(lang, 'Share you can collect (%)')}<input type="number" min={0} max={100} value={eff} onChange={(e) => setEff(+e.target.value)} /></label>
        <div className="calc-out">
          <b>{Math.round(litres).toLocaleString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US')} {tr(lang, 'litres a year')}</b>
          <span>{tr(lang, 'about')} {formatNumber(litres / 365, lang, { maximumFractionDigits: 0 })} {tr(lang, 'litres a day')}</span>
        </div>
      </div>
    </section>
  );
}
