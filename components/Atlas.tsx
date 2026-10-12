'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASEMAPS, BASEMAP_PROVIDER, type BasemapId } from '@/lib/basemaps';
import { loadBasins, loadBorder, loadCanals, loadLakes, loadMask, loadRegionLabels, loadRegions, loadRivers, REGION_LABELS_FC } from '@/lib/data';
import { DEFAULT_LAYERS, type LayerId } from '@/lib/layers';
import { fetchFlood, fetchWeather } from '@/lib/openmeteo';
import { PLACES, nameOf, sortPlaces, type SortId } from '@/lib/places';
import { EMPTY_FC, type Basin, type FloodPoint, type Lang, type LoadState, type PlaceType, type WeatherPoint } from '@/lib/types';
import { tr } from '@/lib/i18n';
import type { GeoBundle } from './MapView';
import Sidebar, { type Filters } from './Sidebar';
import LayerBar from './LayerBar';
import Legend from './Legend';
import DetailDrawer from './DetailDrawer';
import FloodWatch from './tabs/FloodWatch';
import RainHarvest from './tabs/RainHarvest';
import BasinsGroundwater from './tabs/BasinsGroundwater';
import Statistics from './tabs/Statistics';
import DataSources from './tabs/DataSources';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map-canvas map-loading">Loading map…</div> });

const TABS = [
  { id: 'map', label: 'Map' },
  { id: 'flood', label: 'Flood watch' },
  { id: 'rain', label: 'Rain and harvesting' },
  { id: 'basins', label: 'Basins and groundwater' },
  { id: 'stats', label: 'Statistics' },
  { id: 'data', label: 'Data and sources' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const ALL_TYPES: PlaceType[] = ['dam', 'lake', 'river', 'ramsar', 'gauge', 'basinhq'];
const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'kk', label: 'ҚАЗ' },
  { id: 'ru', label: 'РУС' },
];

export default function Atlas() {
  const [tab, setTab] = useState<TabId>('map');
  const [lang, setLang] = useState<Lang>('en');
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(112);
  const headerRef = useRef<HTMLElement>(null);
  const [basemap, setBasemap] = useState<BasemapId>('map');
  const [layers, setLayers] = useState<Set<LayerId>>(new Set(DEFAULT_LAYERS));
  const [types, setTypes] = useState<Set<PlaceType>>(new Set(ALL_TYPES));
  const [filters, setFilters] = useState<Filters>({ q: '', region: '', basin: '', verification: '', sort: 'largest' as SortId });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [geo, setGeo] = useState<GeoBundle>({
    regions: EMPTY_FC,
    rivers: EMPTY_FC,
    lakes: EMPTY_FC,
    canals: EMPTY_FC,
    border: EMPTY_FC,
    labels: REGION_LABELS_FC,
    mask: EMPTY_FC,
    basins: EMPTY_FC,
  });
  const [weather, setWeather] = useState<WeatherPoint[] | null>(null);
  const [flood, setFlood] = useState<FloodPoint[] | null>(null);
  const [floodUpdatedAt, setFloodUpdatedAt] = useState<Date | null>(null);
  const [refreshingFlood, setRefreshingFlood] = useState(false);
  const [wState, setWState] = useState<LoadState>('loading');
  const [fState, setFState] = useState<LoadState>('loading');
  const dark = themeMode === 'dark' || (themeMode === 'system' && systemDark);

  const refreshFlood = useCallback(async (signal?: AbortSignal) => {
    setRefreshingFlood(true);
    setFState('loading');
    try {
      const data = await fetchFlood(signal);
      if (signal?.aborted) return;
      setFlood(data);
      setFloodUpdatedAt(new Date());
      setFState('ok');
    } catch (e) {
      if (!signal?.aborted) {
        console.warn(e);
        setFState('error');
      }
    } finally {
      if (!signal?.aborted) setRefreshingFlood(false);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let saved: string | null = null;
    try { saved = window.localStorage.getItem('kz-water-atlas-theme'); } catch {}
    if (saved === 'dark' || saved === 'light') setThemeMode(saved);
    setSystemDark(media.matches);
    setThemeReady(true);

    const syncSystemTheme = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark, themeReady]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextMode = themeMode === 'system' ? (systemDark ? 'light' : 'dark') : 'system';
    setThemeMode(nextMode);
    try {
      if (nextMode === 'system') window.localStorage.removeItem('kz-water-atlas-theme');
      else window.localStorage.setItem('kz-water-atlas-theme', nextMode);
    } catch {}
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('kz-water-atlas-lang');
    if (saved === 'en' || saved === 'kk' || saved === 'ru') setLang(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = tr(lang, 'QazaqSu Atlas: Kazakhstan Water Atlas');
    window.localStorage.setItem('kz-water-atlas-lang', lang);
  }, [lang]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadRegions(),
      loadRivers(),
      loadLakes(),
      loadBorder(),
      loadRegionLabels(),
      loadMask(),
      loadBasins(),
      loadCanals(),
    ]).then(
      ([regions, rivers, lakes, border, labels, mask, basins, canals]) => {
        if (!alive) return;
        setGeo({ regions, rivers, lakes, border, labels, mask, basins, canals });
        if (!regions.features.length) setNotice('Region boundaries could not be loaded. Run "npm run data" to cache them locally.');
      }
    );
    const ac = new AbortController();
    fetchWeather(ac.signal).then((d) => { setWeather(d); setWState('ok'); }).catch((e) => { if (!ac.signal.aborted) { console.warn(e); setWState('error'); } });
    void refreshFlood(ac.signal);
    return () => { alive = false; ac.abort(); };
  }, [refreshFlood]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(t);
  }, [notice]);

  // places passing every filter except the type chips (used for chip counts)
  const base = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return PLACES.filter((p) => {
      if (filters.region && p.region !== filters.region) return false;
      if (filters.basin && p.basin !== filters.basin) return false;
      if (filters.verification && p.verification !== filters.verification) return false;
      if (q) {
        const hay = `${p.name.en} ${p.name.kk} ${p.name.ru} ${p.region} ${p.basin}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    base.forEach((p) => { c[p.type] = (c[p.type] ?? 0) + 1; });
    return c;
  }, [base]);
  const shown = useMemo(() => sortPlaces(base.filter((p) => types.has(p.type)), filters.sort, lang), [base, types, filters.sort, lang]);

  const toggleLayer = (id: LayerId) =>
    setLayers((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleType = (t: PlaceType) =>
    setTypes((s) => {
      const n = new Set(s);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  const resetFilters = () => {
    setFilters({ q: '', region: '', basin: '', verification: '', sort: 'largest' });
    setTypes(new Set(ALL_TYPES));
  };
  const selected = PLACES.find((p) => p.id === selectedId);

  return (
    <div className="app">
      <header className="top" ref={headerRef}>
        <div className="brand">
          <svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true">
            <path d="M15 1C15 1 3 15 3 24a12 12 0 0 0 24 0C27 15 15 1 15 1Z" fill="var(--accent)" />
            <path d="M9 25c2-3 4 1 6-1s4 1 6-1" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <div>
            <h1>{tr(lang, 'QazaqSu Atlas: Kazakhstan Water Atlas')}</h1>
            <p>{tr(lang, 'Rivers, dams, lakes, wetlands, groundwater and flood watch · 17 regions and 3 cities')}</p>
          </div>
        </div>
        <div className="top-tools">
          <div className="seg" role="group" aria-label={tr(lang, 'Language')}>
            {LANGS.map((l) => (
              <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>
            ))}
          </div>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={tr(lang, 'Toggle dark mode')}
            title={tr(lang, themeMode === 'system' ? 'Theme follows system' : 'Use system theme')}
          >
            {dark ? '☀' : '☾'}
          </button>
        </div>
        <nav className="tabs" aria-label={tr(lang, 'Sections')}>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{tr(lang, t.label)}</button>
          ))}
        </nav>
      </header>

      <main className={tab === 'map' ? 'main-map' : 'main-page'}>
        <section className="map-layout" hidden={tab !== 'map'}>
          <Sidebar
            filters={filters}
            setFilters={setFilters}
            types={types}
            toggleType={toggleType}
            counts={counts}
            shown={shown}
            lang={lang}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReset={resetFilters}
          />
          <div className="map-wrap">
            <MapView
              visible={tab === 'map'}
              basemap={basemap}
              dark={dark}
              layers={layers}
              places={shown}
              lang={lang}
              selectedId={selectedId}
              onSelect={setSelectedId}
              region={filters.region}
              basin={filters.basin}
              geo={geo}
              weather={weather}
              flood={flood}
              onNotice={setNotice}
            />
            <div className="basemaps" role="group" aria-label={tr(lang, 'Basemap')}>
              {BASEMAPS.map((b) => (
                <button key={b.id} className={basemap === b.id ? 'on' : ''} onClick={() => setBasemap(b.id)}>{tr(lang, b.label)}</button>
              ))}
            </div>
            <LayerBar layers={layers} toggle={toggleLayer} lang={lang} />
            <Legend layers={layers} types={types} lang={lang} />
            {notice && (
              <div className="notice" role="status">
                {tr(lang, notice)}
                <button onClick={() => setNotice(null)} aria-label={tr(lang, 'Dismiss')}>×</button>
              </div>
            )}
            <div className="provider">Basemap: {BASEMAP_PROVIDER}</div>
          </div>
        </section>

        {tab === 'flood' && <FloodWatch flood={flood} state={fState} lang={lang} />}
        {tab === 'rain' && <RainHarvest weather={weather} state={wState} lang={lang} />}
        {tab === 'basins' && (
          <BasinsGroundwater
            flood={flood}
            state={fState}
            updatedAt={floodUpdatedAt}
            refreshing={refreshingFlood}
            lang={lang}
            onRefresh={() => { void refreshFlood(); }}
            onShowBasin={(basin: Basin) => {
              setFilters((current) => ({ ...current, basin, region: '', q: '' }));
              setTypes(new Set(ALL_TYPES));
              setSelectedId(null);
              setTab('map');
            }}
          />
        )}
        {tab === 'stats' && <Statistics lang={lang} />}
        {tab === 'data' && <DataSources lang={lang} />}
      </main>
      {tab === 'map' && selected && (
        <div className="detail-overlay" style={{ top: headerHeight }}>
          <button
            className="detail-backdrop"
            onClick={() => setSelectedId(null)}
            aria-label={tr(lang, 'Close details panel')}
            tabIndex={-1}
          />
          <DetailDrawer
            place={selected}
            allPlaces={PLACES}
            floodPoints={flood}
            lang={lang}
            onClose={() => setSelectedId(null)}
            onSelectPlace={setSelectedId}
          />
        </div>
      )}
    </div>
  );
}
