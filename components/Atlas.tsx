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
import { buildSearch, readUrlState, type MapViewState, type UrlState } from '@/lib/urlState';
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
import Icon from './Icon';
import NearMe, { type UserLocation } from './NearMe';
import type { LatLon } from '@/lib/geo';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map-canvas map-loading">Loading map…</div> });

const TABS = [
  { id: 'map', label: 'Map', short: 'Map' },
  { id: 'flood', label: 'Flood watch', short: 'Floods' },
  { id: 'rain', label: 'Rain and harvesting', short: 'Rain' },
  { id: 'basins', label: 'Basins and groundwater', short: 'Basins' },
  { id: 'stats', label: 'Statistics', short: 'Statistics' },
  { id: 'data', label: 'Data and sources', short: 'Sources' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const TAB_IDS = TABS.map((t) => t.id);
const PRIMARY_TABS: TabId[] = ['map', 'flood', 'rain', 'basins'];
const MORE_TABS: TabId[] = ['stats', 'data'];

const ICON_PATHS: Record<TabId | 'more', string> = {
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13m6-10.5v13',
  flood: 'M3 15c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M3 19.5c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M12 3v8m-3.5-3.5L12 11l3.5-3.5',
  rain: 'M7 15a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 6.5a4 4 0 0 1 .5 8M8 18l-1 2.5m5-2.5-1 2.5m5-2.5-1 2.5',
  basins: 'M12 3c-2 3.5-6 6-6 10a6 6 0 0 0 12 0c0-4-4-6.5-6-10Zm-3 11c.8 1.6 2 2.4 3.5 2.4',
  stats: 'M4 20h16M7 16v-5m5 5V7m5 9v-3',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
};
function TabIcon({ id }: { id: TabId | 'more' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={id === 'more' ? 3 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[id]} />
    </svg>
  );
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<(UserLocation & { nearest: LatLon | null; at: number }) | null>(null);
  const onLocated = useCallback((here: UserLocation, nearest: LatLon | null) => setUserLoc({ ...here, nearest, at: Date.now() }), []);
  const onClearLocation = useCallback(() => setUserLoc(null), []);

  // ---- shareable links: state <-> URL ----
  const [urlReady, setUrlReady] = useState(false);
  const [initialView, setInitialView] = useState<MapViewState | null>(null);
  const viewRef = useRef<MapViewState | null>(null);
  const lastWritten = useRef<{ tab: string; place: string | null }>({ tab: 'map', place: null });
  const fromPop = useRef(false);

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
    let saved: string | null = null;
    try { saved = window.localStorage.getItem('kz-water-atlas-lang'); } catch {}
    if (saved === 'en' || saved === 'kk' || saved === 'ru') setLang(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = tr(lang, 'QazaqSu Atlas: Kazakhstan Water Atlas');
  }, [lang]);

  // Saved only on an explicit choice, so a page load (or a link with ?lang=) never
  // overwrites the visitor's own preference.
  const chooseLang = (l: Lang) => {
    setLang(l);
    try { window.localStorage.setItem('kz-water-atlas-lang', l); } catch {}
  };

  const applyUrl = useCallback((u: UrlState, initial: boolean) => {
    setTab((u.tab as TabId) ?? 'map');
    setSelectedId(u.place ?? null);
    setLayers(new Set(u.layers ?? DEFAULT_LAYERS));
    setBasemap(u.base ?? 'map');
    setFilters((f) => ({ ...f, region: u.region ?? '', basin: u.basin ?? '', q: u.q ?? '' }));
    if (u.place) {
      // A shared place must be visible even if its type is off by default (canals, glaciers).
      const type = PLACES.find((p) => p.id === u.place)?.type;
      if (type) setTypes((t) => (t.has(type) ? t : new Set([...Array.from(t), type])));
    }
    if (initial) {
      setInitialView(u.view ?? null);
      viewRef.current = u.view ?? null;
      lastWritten.current = { tab: u.tab ?? 'map', place: u.place ?? null };
      if (u.lang) setLang(u.lang);
    }
  }, []);

  useEffect(() => {
    applyUrl(readUrlState(window.location.search, TAB_IDS), true);
    setUrlReady(true);
    const onPop = () => {
      fromPop.current = true;
      applyUrl(readUrlState(window.location.search, TAB_IDS), false);
      setTimeout(() => { fromPop.current = false; }, 400);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [applyUrl]);

  const latest = useRef({ tab, selectedId, layers, basemap, filters });
  latest.current = { tab, selectedId, layers, basemap, filters };

  // Opening a place or changing section adds a history step (so Back closes the
  // details panel); everything else, including panning, just updates the URL.
  const writeUrl = useCallback(() => {
    const st = latest.current;
    const search = buildSearch({
      tab: st.tab, place: st.selectedId, view: viewRef.current, layers: st.layers, base: st.basemap,
      region: st.filters.region, basin: st.filters.basin, q: st.filters.q,
    });
    const prev = lastWritten.current;
    lastWritten.current = { tab: st.tab, place: st.selectedId };
    if (search === window.location.search) return;
    const url = `${window.location.pathname}${search}${window.location.hash}`;
    const step = !fromPop.current && (prev.tab !== st.tab || prev.place !== st.selectedId);
    if (step) window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    if (urlReady) writeUrl();
  }, [urlReady, writeUrl, tab, selectedId, layers, basemap, filters.region, filters.basin, filters.q]);

  const onViewChange = useCallback((v: MapViewState) => {
    viewRef.current = v;
    if (urlReady) writeUrl();
  }, [urlReady, writeUrl]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const shareView = useCallback(async () => {
    const url = window.location.href;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') {
      try { await navigator.share({ title: document.title, url }); return; }
      catch (e) { if ((e as Error)?.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied');
      return;
    } catch {}
    // Fallback for browsers or embedded views that block the Clipboard API.
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    setToast(ok ? 'Link copied' : 'Could not copy the link. Copy it from the address bar.');
  }, []);

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
  // Open a place on the map, clearing filters that could hide it.
  const showPlace = (id: string) => { resetFilters(); setSelectedId(id); setTab('map'); };
  const selected = PLACES.find((p) => p.id === selectedId);
  const activeFilters = [filters.region, filters.basin, filters.verification].filter(Boolean).length
    + (types.size !== ALL_TYPES.length || ALL_TYPES.some((t) => !types.has(t)) ? 1 : 0);

  return (
    <div className="app">
      <header className="top" ref={headerRef}>
        <div className="brand">
          <svg className="brand-mark" width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
            {/* Ram's-horn (qoshqar müiz) ornament over water */}
            <rect width="32" height="32" rx="5" fill="var(--accent)" />
            <path
              d="M16 22V14.5C16 10 12.8 7.5 9.6 7.5 6.9 7.5 5 9.3 5 11.7c0 2.3 1.8 3.9 3.8 3.9 1.8 0 3-1.2 3-2.8M16 14.5C16 10 19.2 7.5 22.4 7.5c2.7 0 4.6 1.8 4.6 4.2 0 2.3-1.8 3.9-3.8 3.9-1.8 0-3-1.2-3-2.8"
              fill="none" stroke="var(--accent-ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
            />
            <path d="M5 25.5c1.8 1.3 3.7 1.3 5.5 0s3.7-1.3 5.5 0 3.7 1.3 5.5 0 3.7-1.3 5.5 0" fill="none" stroke="var(--accent-ink)" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
          </svg>
          <div>
            <h1>
              <span className="wm">Qazaq<b>Su</b></span>
              <span className="wm-sub">{tr(lang, 'Kazakhstan Water Atlas')}</span>
            </h1>
            <p>{tr(lang, 'Rivers, dams, lakes, wetlands, groundwater and flood watch · 17 regions and 3 cities')}</p>
          </div>
        </div>
        <div className="top-tools">
          <div className="seg" role="group" aria-label={tr(lang, 'Language')}>
            {LANGS.map((l) => (
              <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} onClick={() => chooseLang(l.id)}>{l.label}</button>
            ))}
          </div>
          <button
            className="icon-btn"
            onClick={() => { void shareView(); }}
            aria-label={tr(lang, 'Share this view')}
            title={tr(lang, 'Share this view')}
          >
            <Icon name="share" />
          </button>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={tr(lang, 'Toggle dark mode')}
            title={tr(lang, themeMode === 'system' ? 'Theme follows system' : 'Use system theme')}
          >
            <Icon name={dark ? 'sun' : 'moon'} />
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
            activeFilters={activeFilters}
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
              initialView={initialView}
              onViewChange={onViewChange}
              userLocation={userLoc}
            />
            <NearMe lang={lang} flood={flood} onLocated={onLocated} onClear={onClearLocation} onShowPlace={showPlace} />
            <div className="basemaps" role="group" aria-label={tr(lang, 'Basemap')}>
              {BASEMAPS.map((b) => (
                <button key={b.id} className={basemap === b.id ? 'on' : ''} onClick={() => setBasemap(b.id)}>{tr(lang, b.label)}</button>
              ))}
            </div>
            <LayerBar layers={layers} toggle={toggleLayer} lang={lang} basemap={basemap} setBasemap={setBasemap} />
            <Legend layers={layers} types={types} lang={lang} />
            {notice && (
              <div className="notice" role="status">
                {tr(lang, notice)}
                <button onClick={() => setNotice(null)} aria-label={tr(lang, 'Dismiss')}><Icon name="close" /></button>
              </div>
            )}
            <div className="provider">Basemap: {BASEMAP_PROVIDER}</div>
          </div>
        </section>

        {tab === 'flood' && (
          <FloodWatch
            flood={flood}
            state={fState}
            lang={lang}
            onShowPlace={showPlace}
          />
        )}
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

      {toast && <div className="toast" role="status">{tr(lang, toast)}</div>}

      <nav className="bottom-nav" aria-label={tr(lang, 'Sections')}>
        {PRIMARY_TABS.map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return (
            <button key={id} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setMoreOpen(false); }}>
              <TabIcon id={id} />
              <span>{tr(lang, t.short)}</span>
            </button>
          );
        })}
        <button
          className={MORE_TABS.includes(tab) || moreOpen ? 'on' : ''}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          onClick={() => setMoreOpen((o) => !o)}
        >
          <TabIcon id="more" />
          <span>{tr(lang, 'More')}</span>
        </button>
        {moreOpen && (
          <>
            <button className="more-backdrop" aria-label={tr(lang, 'Close menu')} tabIndex={-1} onClick={() => setMoreOpen(false)} />
            <div className="more-menu" role="menu">
              {MORE_TABS.map((id) => {
                const t = TABS.find((x) => x.id === id)!;
                return (
                  <button key={id} role="menuitem" className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMoreOpen(false); }}>
                    <TabIcon id={id} />
                    {tr(lang, t.label)}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

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
