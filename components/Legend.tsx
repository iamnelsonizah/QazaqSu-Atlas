'use client';

import { useState } from 'react';
import { LAYERS, type LayerId } from '@/lib/layers';
import { TYPE_META, TYPE_ORDER } from '@/lib/places';
import type { PlaceType } from '@/lib/types';
import type { Lang } from '@/lib/types';
import { tr } from '@/lib/i18n';

export default function Legend({ layers, types, lang }: { layers: Set<LayerId>; types: Set<PlaceType>; lang: Lang }) {
  const [open, setOpen] = useState(true);
  const active = LAYERS.filter((l) => layers.has(l.id) && !l.needs);
  return (
    <div className="legend">
      <button className="legend-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {tr(lang, 'On the map')} <span>{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div className="legend-body">
          <div className="lg">
            <i className="sw line" style={{ background: '#22c55e', border: '1px solid rgba(0, 0, 0, 0.45)', height: '4px' }} />
            {tr(lang, 'Kazakhstan national border')}
          </div>
          {TYPE_ORDER.filter((t) => types.has(t)).map((t) => (
            <div className="lg" key={t}><i className="sw dot" style={{ background: TYPE_META[t].color }} />{tr(lang, TYPE_META[t].plural)}</div>
          ))}
          {active.flatMap((l) =>
            l.legend.map((it) => (
              <div className="lg" key={`${l.id}-${it.label}`}>
                <i className={`sw ${it.kind ?? 'swatch'}`} style={{ background: it.color }} />
                {tr(lang, it.label)}
              </div>
            )),
          )}
          <p className="lg-note">{tr(lang, 'Dot size follows capacity, area or length. Faded dots: location approximate.')}</p>
        </div>
      )}
    </div>
  );
}
