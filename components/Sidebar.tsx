'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BASINS, type Lang, type Place, type PlaceType } from '@/lib/types';
import { REGIONS, SORTS, TYPE_META, TYPE_ORDER, altNames, nameOf, sizeText, type SortId } from '@/lib/places';
import { tr } from '@/lib/i18n';

export interface Filters { q: string; region: string; basin: string; verification: string; sort: SortId }

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  types: Set<PlaceType>;
  toggleType: (t: PlaceType) => void;
  counts: Record<string, number>;
  shown: Place[];
  lang: Lang;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReset: () => void;
  activeFilters: number;
}

type Snap = 'peek' | 'half' | 'full';
const NEXT_SNAP: Record<Snap, Snap> = { peek: 'half', half: 'full', full: 'peek' };

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return compact;
}

export default function Sidebar({ filters, setFilters, types, toggleType, counts, shown, lang, selectedId, onSelect, onReset, activeFilters }: Props) {
  const compact = useCompact();
  const [snap, setSnap] = useState<Snap>('peek');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; h: number; t: number; moved: boolean } | null>(null);

  const snapHeights = () => {
    const parent = sheetRef.current?.parentElement?.clientHeight ?? window.innerHeight;
    const peek = parseFloat(getComputedStyle(sheetRef.current!).getPropertyValue('--peek')) || 132;
    return { peek, half: Math.round(parent * 0.52), full: parent - 8 };
  };
  const onHandleDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!sheetRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, h: sheetRef.current.getBoundingClientRect().height, t: performance.now(), moved: false };
  };
  const onHandleMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 6) d.moved = true;
    if (!d.moved) return;
    const { peek, full } = snapHeights();
    setDragHeight(Math.min(full, Math.max(peek, d.h - dy)));
  };
  const onHandleUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      setSnap((s) => NEXT_SNAP[s]);
      return;
    }
    const h = sheetRef.current?.getBoundingClientRect().height ?? d.h;
    const velocity = (e.clientY - d.y) / Math.max(1, performance.now() - d.t); // px/ms, positive = down
    const heights = snapHeights();
    let target: Snap = (Object.keys(heights) as Snap[]).reduce((best, k) => (Math.abs(heights[k] - h) < Math.abs(heights[best] - h) ? k : best), 'peek');
    if (velocity > 0.6) target = h > heights.half ? 'half' : 'peek';
    else if (velocity < -0.6) target = h < heights.half ? 'half' : 'full';
    setDragHeight(null);
    setSnap(target);
    if (target === 'peek') setFiltersOpen(false);
  };

  const openFilters = () => {
    setFiltersOpen(true);
    setSnap('full');
  };
  const closeFilters = () => {
    setFiltersOpen(false);
    setSnap('half');
  };
  const select = (id: string) => {
    onSelect(id);
    if (compact) setSnap('peek');
  };

  const set = (patch: Partial<Filters>) => {
    if ('region' in patch || 'basin' in patch) {
      onSelect(null);
    }
    setFilters({ ...filters, ...patch });
  };
  return (
    <aside
      ref={sheetRef}
      className={`sidebar ${filtersOpen ? 'filters-open' : ''} ${dragHeight != null ? 'dragging' : ''}`}
      data-sheet={snap}
      style={compact && dragHeight != null ? { height: dragHeight } : undefined}
      aria-label={tr(lang, 'Places')}
    >
      <button
        type="button"
        className="sheet-handle"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={() => { drag.current = null; setDragHeight(null); }}
        aria-label={tr(lang, snap === 'full' ? 'Collapse list' : 'Expand list')}
      >
        <span />
      </button>
      <div className="side-head">
        <label className="search">
          <span className="sr-only">{tr(lang, 'Search')}</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            onFocus={() => { if (compact && snap === 'peek') setSnap('half'); }}
            placeholder={tr(lang, 'Search a name, river or region (Balkhash, Ertis, Атырау)')}
          />
        </label>

        <div className="filter-panel">
        <div className="filter-panel-head">
          <h2>{tr(lang, 'Filters')}</h2>
          <button type="button" onClick={onReset}>{tr(lang, 'Reset filters')}</button>
        </div>
        <h2 className="side-label">{tr(lang, 'Show')}</h2>
        <div className="chips">
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              className={`chip ${types.has(t) ? 'on' : ''}`}
              onClick={() => toggleType(t)}
              aria-pressed={types.has(t)}
            >
              <i style={{ background: TYPE_META[t].color }} />
              {tr(lang, TYPE_META[t].plural)}
              <span>{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="filters">
          <label>
            {tr(lang, 'Region')}
            <select value={filters.region} onChange={(e) => set({ region: e.target.value })}>
              <option value="">{tr(lang, 'All regions')}</option>
              {REGIONS.map((r) => <option key={r} value={r}>{tr(lang, r)}</option>)}
            </select>
          </label>
          <label>
            {tr(lang, 'River basin')}
            <select value={filters.basin} onChange={(e) => set({ basin: e.target.value })}>
              <option value="">{tr(lang, 'All 8 basins')}</option>
              {BASINS.map((b) => <option key={b} value={b}>{tr(lang, b)}</option>)}
            </select>
          </label>
          <label>
            {tr(lang, 'Verification')}
            <select value={filters.verification} onChange={(e) => set({ verification: e.target.value })}>
              <option value="">{tr(lang, 'All levels')}</option>
              <option value="A">{tr(lang, 'A · well documented')}</option>
              <option value="B">{tr(lang, 'B · figures approximate')}</option>
              <option value="C">{tr(lang, 'C · confirm before use')}</option>
            </select>
          </label>
          <label>
            {tr(lang, 'Sort')}
            <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortId })}>
              {SORTS.map((s) => <option key={s.id} value={s.id}>{tr(lang, s.label)}</option>)}
            </select>
          </label>
        </div>
        <button type="button" className="filter-done" onClick={closeFilters}>
          {tr(lang, 'Show {count} places').replace('{count}', String(shown.length))}
        </button>
        </div>
      </div>

      <div className="count-row">
        <span>{tr(lang, '{count} places shown').replace('{count}', String(shown.length))}</span>
        <button className="reset-btn" onClick={onReset}>{tr(lang, 'Reset filters')}</button>
        <button className={`filters-btn ${activeFilters ? 'has' : ''}`} onClick={filtersOpen ? closeFilters : openFilters} aria-expanded={filtersOpen}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          {tr(lang, 'Filters')}
          {activeFilters > 0 && <b>{activeFilters}</b>}
        </button>
      </div>

      <ul className="list">
        {shown.length === 0 && <li className="empty">{tr(lang, 'Nothing matches. Clear a filter or search for a different name.')}</li>}
        {shown.map((p) => (
          <li key={p.id}>
            <button className={`item ${selectedId === p.id ? 'sel' : ''}`} onClick={() => select(p.id)}>
              <i className="dot" style={{ background: TYPE_META[p.type].color }} />
              <span className="item-main">
                <span className="item-title">
                  {nameOf(p, lang)} <em className={`ver v${p.verification}`} title={tr(lang, 'Verification level')}>{p.verification}</em>
                </span>
                <span className="item-sub">{tr(lang, TYPE_META[p.type].label)} · {tr(lang, p.region)} · {tr(lang, p.basin)}</span>
                <span className="item-alt">{altNames(p, lang)}</span>
              </span>
              <span className="item-metric">
                {sizeText(p, lang)}
                {p.year ? <small>{p.year}</small> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
