'use client';

import { useState } from 'react';
import { LAYERS, LAYER_GROUPS, type LayerId } from '@/lib/layers';
import type { Lang } from '@/lib/types';
import { BASEMAPS, type BasemapId } from '@/lib/basemaps';
import { tr } from '@/lib/i18n';
import Icon from './Icon';

interface Props {
  layers: Set<LayerId>;
  toggle: (id: LayerId) => void;
  lang: Lang;
  basemap: BasemapId;
  setBasemap: (id: BasemapId) => void;
}

const LAYERS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" />
  </svg>
);

export default function LayerBar({ layers, toggle, lang, basemap, setBasemap }: Props) {
  // Starts closed on every screen size so the map is the first thing people see.
  const [collapsed, setCollapsed] = useState(true);
  const activeCount = Array.from(layers).length;

  if (collapsed) {
    return (
      <div className="layerbar layerbar-collapsed">
        <button
          className="layerbar-toggle-btn"
          onClick={() => setCollapsed(false)}
          title={tr(lang, 'Show map layer controls')}
        >
          {LAYERS_ICON}
          <b>{tr(lang, 'Layers')}</b> <span className="layer-count">{activeCount}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="layerbar" role="group" aria-label={tr(lang, 'Map layers')}>
      <div className="layerbar-head">
        <span className="layerbar-title">{LAYERS_ICON}{tr(lang, 'Map layers')}</span>
        <button
          className="layerbar-collapse-btn"
          onClick={() => setCollapsed(true)}
          title={tr(lang, 'Minimize layer bar to see more map')}
        >
          <span className="hide-text">{tr(lang, 'Hide layers')}</span>
          <Icon name="chevronUp" size={14} className="hide-text" />
          <Icon name="close" size={20} className="close-x" />
        </button>
      </div>
      <div className="layer-basemaps" role="group" aria-label={tr(lang, 'Basemap')}>
        {BASEMAPS.map((b) => (
          <button key={b.id} className={basemap === b.id ? 'on' : ''} aria-pressed={basemap === b.id} onClick={() => setBasemap(b.id)}>{tr(lang, b.label)}</button>
        ))}
      </div>
      <div className="layerbar-content">
        {LAYER_GROUPS.map((g) => {
          const items = LAYERS.filter((l) => l.group === g);
          if (!items.length) return null;
          return (
            <div className="lgroup" key={g}>
              <span className="lgroup-name">{tr(lang, g)}</span>
              {items.map((l) => (
                <button
                  key={l.id}
                  className={`ltoggle ${layers.has(l.id) ? 'on' : ''} ${l.needs ? 'needs' : ''}`}
                  aria-pressed={layers.has(l.id)}
                  disabled={!!l.needs}
                  title={l.needs ? tr(lang, 'Set {key} in .env.local to enable ({source})').replace('{key}', l.needs).replace('{source}', tr(lang, l.source)) : tr(lang, l.source)}
                  onClick={() => toggle(l.id)}
                >
                  {tr(lang, l.label)}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
