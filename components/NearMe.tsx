'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ALERT_LABEL, type FloodPoint, type Lang } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';
import { PLACES, nameOf } from '@/lib/places';
import { bearingDeg, distanceKm, inKazakhstanBox, type LatLon } from '@/lib/geo';
import { fetchPlaceWeather, type PlaceWeatherDay } from '@/lib/openmeteo';
import Icon from './Icon';
import { forecastDay } from '@/lib/dates';

export interface UserLocation extends LatLon { accuracy: number }

interface Props {
  lang: Lang;
  flood: FloodPoint[] | null;
  /** Called with the person's position and the nearest flood-watch point, so the map can show both. */
  onLocated: (here: UserLocation, nearest: LatLon | null) => void;
  onClear: () => void;
  onShowPlace: (id: string) => void;
}

type Status = 'idle' | 'locating' | 'ok' | 'error';

const GAUGES = PLACES.filter((p) => p.type === 'gauge');
// ~1 km: enough for a forecast grid cell, without sending a precise position anywhere.
const round2 = (v: number) => Math.round(v * 100) / 100;

function km(d: number, lang: Lang) {
  return `${formatNumber(d, lang, { maximumFractionDigits: d < 10 ? 1 : 0 })} ${tr(lang, 'km')}`;
}


export default function NearMe({ lang, flood, onLocated, onClear, onShowPlace }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [here, setHere] = useState<UserLocation | null>(null);
  const [days, setDays] = useState<PlaceWeatherDay[] | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const weatherAbort = useRef<AbortController | null>(null);

  useEffect(() => () => weatherAbort.current?.abort(), []);

  const ranked = here
    ? GAUGES.map((g) => ({ g, d: distanceKm(here, g), b: bearingDeg(here, g) })).sort((a, b) => a.d - b.d)
    : [];
  const pointFor = (id: string) => flood?.find((f) => f.id === id) ?? null;

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('error');
      setError('Your browser cannot share its location.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setHere(loc);
        setStatus('ok');
        const nearest = GAUGES.reduce<{ g: (typeof GAUGES)[number]; d: number } | null>((best, g) => {
          const d = distanceKm(loc, g);
          return !best || d < best.d ? { g, d } : best;
        }, null);
        onLocated(loc, nearest ? { lat: nearest.g.lat, lon: nearest.g.lon } : null);

        weatherAbort.current?.abort();
        const ac = new AbortController();
        weatherAbort.current = ac;
        setDays(null);
        setWeatherFailed(false);
        fetchPlaceWeather(round2(loc.lat), round2(loc.lon), ac.signal)
          .then((d) => {
            if (ac.signal.aborted) return;
            if (d.length) setDays(d.slice(0, 3));
            else setWeatherFailed(true);
          })
          .catch(() => { if (!ac.signal.aborted) setWeatherFailed(true); });
      },
      (err) => {
        setStatus('error');
        setError(err.code === err.PERMISSION_DENIED
          ? 'Location is turned off for this site. Allow it in your browser settings, or search for a place instead.'
          : 'Could not get your location. Try again in a moment.');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  }, [onLocated]);

  const close = () => {
    weatherAbort.current?.abort();
    setStatus('idle');
    setHere(null);
    setDays(null);
    onClear();
  };

  const nearest = ranked[0];
  const nearestPoint = nearest ? pointFor(nearest.g.id) : null;

  return (
    <>
      <button
        type="button"
        className={`near-btn ${status !== 'idle' ? 'on' : ''}`}
        onClick={status === 'idle' || status === 'error' ? locate : close}
        aria-pressed={status !== 'idle'}
        title={tr(lang, 'Near me')}
      >
        <Icon name="locate" />
        <span>{tr(lang, 'Near me')}</span>
      </button>

      {status !== 'idle' && (
        <section className="near-card" aria-live="polite" aria-label={tr(lang, 'Near you')}>
          <header className="near-head">
            <h2>{tr(lang, status === 'error' ? 'Near me' : 'Near you')}</h2>
            <button type="button" className="near-close" onClick={close} aria-label={tr(lang, 'Dismiss')}>
              <Icon name="close" />
            </button>
          </header>

          {status === 'locating' && <p className="muted near-msg">{tr(lang, 'Finding your location…')}</p>}

          {status === 'error' && (
            <>
              <p className="near-msg">{tr(lang, error)}</p>
              <button type="button" className="near-retry" onClick={locate}>{tr(lang, 'Try again')}</button>
            </>
          )}

          {status === 'ok' && here && nearest && (
            <>
              {!inKazakhstanBox(here) && (
                <p className="near-msg near-outside">{tr(lang, 'You appear to be outside Kazakhstan, so the nearest point is far away.')}</p>
              )}

              <div className="near-label">{tr(lang, 'Nearest flood-watch point')}</div>
              <div className="near-main">
                <div className="near-main-head">
                  <strong>{nameOf(nearest.g, lang)}</strong>
                  {nearestPoint
                    ? <span className={`pill ${nearestPoint.level}`}>{tr(lang, ALERT_LABEL[nearestPoint.level])}</span>
                    : <span className="pill">{tr(lang, flood ? 'No data' : '…')}</span>}
                </div>
                <div className="near-dist">
                  {/* arrowRight points east (90°), so rotate by bearing - 90 to point at the gauge */}
                  <span className="near-arrow" style={{ transform: `rotate(${Math.round(nearest.b - 90)}deg)` }} aria-hidden="true">
                    <Icon name="arrowRight" size={14} />
                  </span>
                  {tr(lang, '{km} away').replace('{km}', km(nearest.d, lang))}
                </div>
                {nearestPoint && (
                  <dl className="near-flow">
                    <div><dt>{tr(lang, 'Flow now')}</dt><dd>{nearestPoint.now != null ? formatNumber(nearestPoint.now, lang, { maximumFractionDigits: nearestPoint.now < 10 ? 1 : 0 }) : '–'} <small>{tr(lang, 'm³/s')}</small></dd></div>
                    <div><dt>{tr(lang, '7-day peak')}</dt><dd>{nearestPoint.peak != null ? formatNumber(nearestPoint.peak, lang, { maximumFractionDigits: nearestPoint.peak < 10 ? 1 : 0 }) : '–'} <small>{tr(lang, 'm³/s')}</small></dd></div>
                  </dl>
                )}
                {!flood && <p className="muted near-msg">{tr(lang, 'Loading river flow…')}</p>}
                <button type="button" className="near-link" onClick={() => onShowPlace(nearest.g.id)}>
                  {tr(lang, 'Show on map')} <Icon name="arrowRight" size={13} />
                </button>
              </div>

              <div className="near-label">{tr(lang, 'Other points nearby')}</div>
              <ul className="near-others">
                {ranked.slice(1, 3).map(({ g, d }) => {
                  const f = pointFor(g.id);
                  return (
                    <li key={g.id}>
                      <button type="button" onClick={() => onShowPlace(g.id)}>
                        <span className="near-other-name">{nameOf(g, lang)}</span>
                        <span className="near-other-km">{km(d, lang)}</span>
                        {f && <span className={`pill ${f.level}`}>{tr(lang, ALERT_LABEL[f.level])}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="near-label">{tr(lang, 'Rain where you are')}</div>
              {days ? (
                <ul className="near-rain">
                  {days.map((d, i) => (
                    <li key={d.date}>
                      <span className="near-day">{forecastDay(d.date, i, lang)}</span>
                      <span className="near-mm"><b>{formatNumber(d.precipMm, lang, { maximumFractionDigits: 1 })}</b> {tr(lang, 'mm')}</span>
                      <span className="near-temp">{d.tMax}° / {d.tMin}°</span>
                    </li>
                  ))}
                </ul>
              ) : weatherFailed ? (
                <p className="error near-msg">{tr(lang, 'Weather could not be loaded. Check your connection and reload the page.')}</p>
              ) : (
                <p className="muted near-msg">{tr(lang, 'Loading weather…')}</p>
              )}

              <p className="near-privacy">{tr(lang, 'Your location stays on this device. Only rounded coordinates (about 1 km) are sent to Open-Meteo for the forecast.')}</p>
            </>
          )}
        </section>
      )}
    </>
  );
}
