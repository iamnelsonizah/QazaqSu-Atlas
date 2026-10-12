'use client';

import { useEffect, useState } from 'react';
import { LAYERS, LAYER_GROUPS, type LayerId } from '@/lib/layers';
import type { Lang } from '@/lib/types';
import { tr } from '@/lib/i18n';

export default function LayerBar({ layers, toggle, lang }: { layers: Set<LayerId>; toggle: (id: LayerId) => void; lang: Lang }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const compact = window.matchMedia('(max-width: 900px)');
    const syncToViewport = (event: MediaQueryList | MediaQueryListEvent) => setCollapsed(event.matches);
    syncToViewport(compact);
    compact.addEventListener('change', syncToViewport);
    return () => compact.removeEventListener('change', syncToViewport);
  }, []);
  const activeCount = Array.from(layers).length;

  if (collapsed) {
    return (
      <div className="layerbar layerbar-collapsed">
        <button
          className="layerbar-toggle-btn"
          onClick={() => setCollapsed(false)}
          title={tr(lang, 'Show map layer controls')}
        >
          <span className="dot" />
          <b>{tr(lang, 'Layers')}</b> ({activeCount} {tr(lang, 'active')}) <span className="chev">▾</span>
        </button>
      </div>
    );
  }

  return (
    <div className="layerbar" role="group" aria-label={tr(lang, 'Map layers')}>
      <div className="layerbar-head">
        <button
          className="layerbar-collapse-btn"
          onClick={() => setCollapsed(true)}
          title={tr(lang, 'Minimize layer bar to see more map')}
        >
          {tr(lang, 'Hide layers')} ▴
        </button>
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
