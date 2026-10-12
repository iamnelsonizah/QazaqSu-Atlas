'use client';

import { SOURCES } from '@/lib/sources';
import type { Lang } from '@/lib/types';
import { tr } from '@/lib/i18n';

export default function DataSources({ lang }: { lang: Lang }) {
  return (
    <section className="page">
      <h2>{tr(lang, 'Data and sources')}</h2>
      <p className="lede">{tr(lang, 'Every layer on the map, where it comes from and what is still needed. Verification levels on places: A well documented, B figures approximate, C confirm before publishing.')}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>{tr(lang, 'Source')}</th><th>{tr(lang, 'Used for')}</th><th>{tr(lang, 'Status')}</th><th>{tr(lang, 'How it is wired')}</th></tr></thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.name}>
                <td><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></td>
                <td>{tr(lang, s.use)}</td>
                <td><span className={`pill st-${s.status.replace(/\s/g, '-').toLowerCase()}`}>{tr(lang, s.status)}</span></td>
                <td>{tr(lang, s.how)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
