'use client';

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
}

export default function Sidebar({ filters, setFilters, types, toggleType, counts, shown, lang, selectedId, onSelect, onReset }: Props) {
  const set = (patch: Partial<Filters>) => {
    if ('region' in patch || 'basin' in patch) {
      onSelect(null);
    }
    setFilters({ ...filters, ...patch });
  };
  return (
    <aside className="sidebar">
      <div className="side-head">
        <label className="search">
          <span className="sr-only">{tr(lang, 'Search')}</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder={tr(lang, 'Search a name, river or region (Balkhash, Ertis, Атырау)')}
          />
        </label>

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
      </div>

      <div className="count-row">
        <span>{tr(lang, '{count} places shown').replace('{count}', String(shown.length))}</span>
        <button onClick={onReset}>{tr(lang, 'Reset filters')}</button>
      </div>

      <ul className="list">
        {shown.length === 0 && <li className="empty">{tr(lang, 'Nothing matches. Clear a filter or search for a different name.')}</li>}
        {shown.map((p) => (
          <li key={p.id}>
            <button className={`item ${selectedId === p.id ? 'sel' : ''}`} onClick={() => onSelect(p.id)}>
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
