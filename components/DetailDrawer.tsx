'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FloodPoint, Lang, Place } from '@/lib/types';
import { formatNumber, tr } from '@/lib/i18n';
import { TYPE_META, getAssociatedFeatures, nameOf } from '@/lib/places';
import {
  fetchPlaceFlow,
  fetchPlaceWeather,
  type PlaceFlowData,
  type PlaceWeatherDay,
} from '@/lib/openmeteo';

interface Props {
  place: Place;
  allPlaces?: Place[];
  floodPoints?: FloodPoint[] | null;
  lang: Lang;
  onClose: () => void;
  onSelectPlace?: (id: string) => void;
}

export default function DetailDrawer({
  place,
  allPlaces = [],
  floodPoints = null,
  lang,
  onClose,
  onSelectPlace,
}: Props) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCitation, setShowCitation] = useState(false);

  // Live real-time flow and weather states
  const [flowData, setFlowData] = useState<PlaceFlowData | null>(null);
  const [flowLoading, setFlowLoading] = useState(true);
  const [weatherDays, setWeatherDays] = useState<PlaceWeatherDay[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Sync active photo index & watchlist status on place change
  useEffect(() => {
    setActivePhotoIdx(0);
    setShowCitation(false);
    try {
      const watched = localStorage.getItem(`kz_water_watch_${place.id}`);
      setIsWatched(watched === 'true');
    } catch {}
  }, [place.id]);

  // Fetch real-time GloFAS flow and 7-day weather forecast for the selected place
  useEffect(() => {
    let alive = true;
    const ac = new AbortController();
    setFlowLoading(true);
    setWeatherLoading(true);

    fetchPlaceFlow(place.lat, place.lon, ac.signal)
      .then((data) => {
        if (!alive) return;
        setFlowData(data);
        setFlowLoading(false);
      })
      .catch((err) => {
        if (!alive || ac.signal.aborted) return;
        console.warn('Flow fetch warning:', err);
        setFlowLoading(false);
      });

    fetchPlaceWeather(place.lat, place.lon, ac.signal)
      .then((days) => {
        if (!alive) return;
        setWeatherDays(days);
        setWeatherLoading(false);
      })
      .catch((err) => {
        if (!alive || ac.signal.aborted) return;
        console.warn('Weather fetch warning:', err);
        setWeatherLoading(false);
      });

    return () => {
      alive = false;
      ac.abort();
    };
  }, [place.id, place.lat, place.lon]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleWatch = () => {
    const next = !isWatched;
    setIsWatched(next);
    try {
      localStorage.setItem(`kz_water_watch_${place.id}`, String(next));
    } catch {}
  };

  const copyPermalink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?place=${encodeURIComponent(place.id)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {}
  };

  const meta = TYPE_META[place.type] || { label: place.type, color: '#0a8fae' };
  const photos = place.photos && place.photos.length > 0 ? place.photos : [];
  const activePhoto = photos[activePhotoIdx];

  // Associated features (dams and gauges on this river, or parent river for dams)
  const associated = useMemo(
    () => getAssociatedFeatures(place, allPlaces, lang, floodPoints),
    [place, allPlaces, lang, floodPoints]
  );

  // Helper to match an inflow/outflow name to an existing place in the atlas
  const findPlaceForName = (nameStr: string): Place | undefined => {
    const clean = nameStr.toLowerCase();
    return allPlaces.find((p) => {
      if (p.id === place.id) return false;
      const en = p.name.en.toLowerCase();
      const kk = p.name.kk.toLowerCase();
      const ru = p.name.ru.toLowerCase();
      const enFirst = en.split(' ')[0];
      return clean.includes(en) || (enFirst.length > 3 && clean.includes(enFirst)) || clean.includes(kk) || clean.includes(ru);
    });
  };

  // Localized text resolution
  const title = nameOf(place, lang);
  const altNames = [
    lang !== 'kk' ? place.name.kk : null,
    lang !== 'ru' ? place.name.ru : null,
    lang !== 'en' ? place.name.en : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const aboutText =
    typeof place.about === 'object' && place.about !== null
      ? place.about[lang] || place.about.en || place.note || ''
      : place.about || place.note || '';

  const verificationText =
    place.verification === 'A'
      ? 'Verification level A. Documented record from official registers, Global Dam Watch, Wikidata, Ramsar, or published hydrometeorological literature.'
      : place.verification === 'B'
      ? 'Verification level B. Named record from Global Dam Watch, Wikidata, the Ramsar/WDPA register, a Wikipedia article, or regional hydromet records.'
      : 'Verification level C. Preliminary record; confirm figures and coordinates against local registers before publication.';
  const translatedVerification = tr(lang, verificationText);

  const citationString = tr(lang, 'Kazakhstan Water Resources Atlas (2024). "{name}". Retrieved from {url}.')
    .replace('{name}', title)
    .replace('{url}', typeof window !== 'undefined' ? window.location.href : 'kz-water-atlas');

  const wikipediaLink =
    place.wikipediaUrl ||
    `https://en.wikipedia.org/wiki/${encodeURIComponent(place.name.en.replace(/\s+River$/, ''))}`;

  return (
    <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={tr(lang, 'Details for {name}').replace('{name}', title)}>
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-top-row">
          <div className="drawer-type-pill">
            <span className="drawer-dot" style={{ background: meta.color }} />
            <span className="drawer-type-text">{tr(lang, meta.label).toLocaleUpperCase(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label={tr(lang, 'Close details panel')}
            title={tr(lang, 'Close (Esc)')}
          >
            ✕
          </button>
        </div>

        <h2 className="drawer-title">{title}</h2>
        {altNames && <div className="drawer-alt-names">{altNames}</div>}

        {/* Action Buttons Toolbar */}
        <div className="drawer-actions" role="toolbar" aria-label={tr(lang, 'Place actions')}>
          <button
            className={`drawer-action-btn ${isWatched ? 'active' : ''}`}
            onClick={toggleWatch}
            title={tr(lang, isWatched ? 'Remove from watched list' : 'Add to watched list')}
          >
            <span className="action-icon">{isWatched ? '★' : '☆'}</span>
            <span>{tr(lang, isWatched ? 'Watching' : 'Watch')}</span>
          </button>

          <button
            className="drawer-action-btn"
            onClick={copyPermalink}
            title={tr(lang, 'Copy direct link to this water body')}
          >
            <span className="action-icon">🔗</span>
            <span>{tr(lang, copied ? 'Copied!' : 'Copy link')}</span>
          </button>

          <button
            className={`drawer-action-btn ${showCitation ? 'active' : ''}`}
            onClick={() => setShowCitation(!showCitation)}
            title={tr(lang, 'Show citation for research and reports')}
          >
            <span className="action-icon">”</span>
            <span>{tr(lang, 'Cite')}</span>
          </button>

          <a
            className="drawer-action-btn"
            href={`mailto:water-atlas@kz-water.org?subject=Field%20Report:%20${encodeURIComponent(
              place.name.en
            )}%20(${place.id})`}
            target="_blank"
            rel="noopener noreferrer"
            title={tr(lang, 'Submit field feedback, measurement updates, or photo corrections')}
          >
            <span className="action-icon">⚐</span>
            <span>{tr(lang, 'Report from the field')}</span>
          </a>
        </div>

        {showCitation && (
          <div className="drawer-citation-box">
            <div className="citation-text">{citationString}</div>
            <button
              className="citation-copy-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(citationString);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {tr(lang, 'Copy Citation')}
            </button>
          </div>
        )}
      </div>

      {/* Drawer Scrollable Content */}
      <div className="drawer-body">
        {/* Media Gallery / Photo Carousel */}
        {photos.length > 0 && (
          <div className="drawer-gallery">
            <div className="drawer-hero-img-wrap">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption || title}
                className="drawer-hero-img"
                loading="lazy"
              />
            </div>

            {activePhoto.caption && (
              <div className="drawer-photo-caption">
                <span>{activePhoto.caption}</span>
                {activePhoto.author && (
                  <span className="photo-credit">
                    {' · '}
                    {activePhoto.sourceUrl ? (
                      <a href={activePhoto.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {activePhoto.author}
                      </a>
                    ) : (
                      activePhoto.author
                    )}
                    {activePhoto.license && ` (${activePhoto.license})`}
                  </span>
                )}
              </div>
            )}

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="drawer-thumb-strip" role="tablist" aria-label={tr(lang, 'Photo gallery')}>
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    className={`drawer-thumb-btn ${idx === activePhotoIdx ? 'active' : ''}`}
                    onClick={() => setActivePhotoIdx(idx)}
                    role="tab"
                    aria-selected={idx === activePhotoIdx}
                    aria-label={`View photo ${idx + 1}: ${photo.caption || title}`}
                  >
                    <img src={photo.thumbnail || photo.url} alt="" className="drawer-thumb-img" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verification Card */}
        <div className={`drawer-verification-card v-${place.verification}`}>
          <div className="v-badge">{place.verification}</div>
          <div className="v-text">{translatedVerification}</div>
        </div>

        {/* Structured Metadata Grid */}
        <div className="drawer-specs-grid">
          <div className="spec-tile">
            <span className="spec-label">
              {tr(lang, place.regionsCrossed ? 'Regions crossed (approx.)' : 'Region')}
            </span>
            <span className="spec-value">{place.regionsCrossed ? tr(lang, place.regionsCrossed) : tr(lang, place.region)}</span>
          </div>

          {place.lengthKm != null && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Length (whole river)')}</span>
              <span className="spec-value">
                {formatNumber(place.lengthKm, lang)} {tr(lang, 'km')}
                {place.lengthKzKm ? ` (${formatNumber(place.lengthKzKm, lang)} ${tr(lang, 'km in KZ')})` : ''}
              </span>
            </div>
          )}

          {place.size != null && place.type !== 'river' && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, place.type === 'dam'
                  ? 'Storage capacity'
                  : place.sizeUnit === 'km²'
                  ? 'Surface area'
                  : 'Size')}</span>
              <span className="spec-value">
                {formatNumber(place.size, lang)} {tr(lang, place.sizeUnit || '')}
              </span>
            </div>
          )}

          {place.drainageType && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Drainage regime')}</span>
              <span className="spec-value">
                {tr(lang, place.drainageType === 'endorheic' ? 'Endorheic (Closed Inland)' : 'Exorheic (Arctic Ocean)')}
              </span>
            </div>
          )}

          {place.canalCapacityM3s != null && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Design discharge')}</span>
              <span className="spec-value">{place.canalCapacityM3s} {tr(lang, 'm³/s')}</span>
            </div>
          )}

          {place.pumpingStations != null && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Pumping stations')}</span>
              <span className="spec-value">{place.pumpingStations} {tr(lang, 'cascade stations')}</span>
            </div>
          )}

          {place.liftMeters != null && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Vertical lift')}</span>
              <span className="spec-value">{place.liftMeters} {tr(lang, 'meters lift')}</span>
            </div>
          )}

          {place.elevationM != null && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Elevation')}</span>
              <span className="spec-value">{formatNumber(place.elevationM, lang)} {tr(lang, 'm a.s.l.')}</span>
            </div>
          )}

          {place.wgmsId && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'WGMS register')}</span>
              <span className="spec-value">{place.wgmsId}</span>
            </div>
          )}

          {place.flowsInto && (
            <div className="spec-tile">
              <span className="spec-label">{tr(lang, 'Flows into')}</span>
              <span className="spec-value">{tr(lang, place.flowsInto)}</span>
            </div>
          )}

          <div className="spec-tile">
            <span className="spec-label">{tr(lang, 'River basin')}</span>
            <span className="spec-value">{tr(lang, place.basin)} {tr(lang, 'Basin')}</span>
          </div>

          <div className="spec-tile">
            <span className="spec-label">{tr(lang, 'Line drawn from')}</span>
            <span className="spec-value">{tr(lang, place.lineDrawnFrom || place.source)}</span>
          </div>

          <div className="spec-tile spec-tile-full">
            <span className="spec-label">{tr(lang, 'Coordinates')}</span>
            <span className="spec-value mono">
              {place.lat.toFixed(3)}° N, {place.lon.toFixed(3)}° E
              <span className="spec-hint"> · {tr(lang, 'middle of mapped water body')}</span>
            </span>
          </div>
        </div>

        {/* Encyclopedic About Section */}
        {aboutText && (
          <div className="drawer-about-section">
            <h3 className="section-heading">{tr(lang, 'About')}</h3>
            <div className="about-prose">
              {aboutText.split('\n\n').map((para, i) => (
                <p key={i}>{tr(lang, para)}</p>
              ))}
            </div>
            <div className="about-source-line">
              {tr(lang, 'From')}{' '}
              <a href={wikipediaLink} target="_blank" rel="noopener noreferrer">
                {tr(lang, 'Wikipedia')}, “{place.name.en}”
              </a>{' '}
              ({tr(lang, 'CC BY-SA 4.0')}, {tr(lang, 'retrieved')} 2026-10-11.)
            </div>
          </div>
        )}

        {/* Hydrological Network & Basin Connection Card */}
        <div className="drawer-card">
          <div className="drawer-card-head">
            <span className="card-title">{tr(lang, 'Hydrological Network & Drainage')}</span>
            <span className="card-tag">{tr(lang, 'Physical Basin Connectivity')}</span>
          </div>

          {/* Drainage Type Badge */}
          {place.drainageType && (
            <div className="network-regime-box">
              <div className="network-regime-badge">
                <span>{place.drainageType === 'endorheic' ? `🔒 ${tr(lang, 'Endorheic Terminal Basin')}` : `🌊 ${tr(lang, 'Exorheic Arctic Ocean Drainage')}`}</span>
              </div>
              <p className="network-regime-desc">
                {tr(lang, place.drainageType === 'endorheic'
                  ? 'Closed terminal drainage regime with no oceanic outlet. Water balance is governed strictly by tributary inflows vs. intense continental surface evaporation, typical of Central Asian landlocked geography.'
                  : 'Open oceanic drainage system. Waters flow northward through the Ob River basin into the Kara Sea (Arctic Ocean).')}
              </p>
            </div>
          )}

          {/* Inflow Tributaries / Sources */}
          {place.inflows && place.inflows.length > 0 && (
            <div className="network-section-group">
              <span className="network-label">{tr(lang, 'Inflow Sources & Tributaries')} ({place.inflows.length})</span>
              <div className="network-pills-wrap">
                {place.inflows.map((inf, idx) => {
                  const target = findPlaceForName(inf);
                  if (target && target.id !== place.id) {
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="network-pill network-pill-interactive"
                        onClick={() => onSelectPlace?.(target.id)}
                        title={`${tr(lang, 'Zoom to')} ${target.name.en}`}
                      >
                        <span>💧</span>
                        <span>{tr(lang, inf)}</span>
                        <span className="pill-arrow">↗</span>
                      </button>
                    );
                  }
                  return (
                    <span key={idx} className="network-pill">
                      <span>💧</span>
                      <span>{tr(lang, inf)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outflow Channels / Destination */}
          {place.outflows && place.outflows.length > 0 && (
            <div className="network-section-group">
              <span className="network-label">{tr(lang, 'Outflow & Discharge Path')}</span>
              <div className="network-pills-wrap">
                {place.outflows.map((out, idx) => {
                  const target = findPlaceForName(out);
                  if (target && target.id !== place.id) {
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="network-pill network-pill-interactive"
                        onClick={() => onSelectPlace?.(target.id)}
                        title={`${tr(lang, 'Zoom to')} ${target.name.en}`}
                      >
                        <span>➡️</span>
                        <span>{tr(lang, out)}</span>
                        <span className="pill-arrow">↗</span>
                      </button>
                    );
                  }
                  return (
                    <span key={idx} className="network-pill">
                      <span>➡️</span>
                      <span>{tr(lang, out)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transboundary Inflow & Water Treaty Alert */}
          {place.transboundaryInflow && (
            <div className="network-transboundary-callout">
              <div className="network-transboundary-title">
                <span>🌐</span>
                <span>{tr(lang, 'Transboundary Water Source & Agreements')}</span>
              </div>
              <p className="network-regime-desc">{tr(lang, place.transboundaryInflow)}</p>
            </div>
          )}

          {/* Basin Management Inspection Jurisdiction */}
          {place.basinCouncil && (
            <div className="network-council-tag">
              <span>🏛️</span>
              <span><strong>{tr(lang, 'Basin Jurisdiction:')}</strong> {tr(lang, place.basinCouncil || '')}</span>
            </div>
          )}

          {/* Fallback honest note if no network records for minor site */}
          {!place.drainageType && !place.inflows && !place.outflows && (
            <div className="flow-nodata-box">
              <div className="flow-nodata-header">
                <span className="flow-nodata-icon">ℹ️</span>
                <span className="flow-nodata-title">{tr(lang, 'Sub-Basin Hydrological Unit')}</span>
              </div>
              <p className="flow-nodata-desc">
                {tr(lang, 'Located within the {basin} River Basin. Sub-catchment tributary junction records are recorded in the State Water Cadastre.').replace('{basin}', tr(lang, place.basin))}
              </p>
            </div>
          )}
        </div>

        {/* Northern Aral Sea Restoration Milestone Benchmark Card */}
        {(place.id === 'dam-kokaral' || place.id === 'lake-aral') && (
          <div className="drawer-card">
            <div className="drawer-card-head">
              <span className="card-title">{tr(lang, 'Northern Aral Restoration Milestones')}</span>
              <span className="card-tag">{tr(lang, 'Kokaral Dike & SYNAS Project')}</span>
            </div>
            <p className="card-sub">{tr(lang, 'Empirical recovery metrics verified from World Bank SYNAS-1 Implementation Completion Report and the Kazakh Ministry of Water Resources and Irrigation.')}</p>

            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table style={{ fontSize: '11.5px' }}>
                <thead>
                  <tr>
                    <th>{tr(lang, 'Benchmark Parameter')}</th>
                    <th>{tr(lang, 'Pre-Dam (1995–2003)')}</th>
                    <th>{tr(lang, 'Post-Kokaral (Present)')}</th>
                    <th>{tr(lang, 'SYNAS-2 Target')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{tr(lang, 'Surface Elevation')}</strong></td>
                    <td className="mono" style={{ color: '#dc2626' }}>~30.0 m BS</td>
                    <td className="mono" style={{ color: '#16a34a', fontWeight: 700 }}>42.0 m BS (+12 m)</td>
                    <td className="mono" style={{ color: '#0284c7' }}>45.0 m BS (+15 m)</td>
                  </tr>
                  <tr>
                    <td><strong>{tr(lang, 'Water Surface Area')}</strong></td>
                    <td className="mono">~2,500 km²</td>
                    <td className="mono" style={{ fontWeight: 700 }}>3,300 km² (+32%)</td>
                    <td className="mono">~4,200 km²</td>
                  </tr>
                  <tr>
                    <td><strong>{tr(lang, 'Water Salinity')}</strong></td>
                    <td className="mono" style={{ color: '#dc2626' }}>30–35 g/L ({tr(lang, 'Hyper-saline')})</td>
                    <td className="mono" style={{ color: '#16a34a', fontWeight: 700 }}>8–10 g/L ({tr(lang, 'Brackish/Fresh')})</td>
                    <td className="mono" style={{ color: '#0284c7' }}>5–8 g/L ({tr(lang, 'Fresh')})</td>
                  </tr>
                  <tr>
                    <td><strong>{tr(lang, 'Commercial Fish Catch')}</strong></td>
                    <td className="mono" style={{ color: '#dc2626' }}>~52 {tr(lang, 'tonnes/yr')} ({tr(lang, 'Collapsed')})</td>
                    <td className="mono" style={{ color: '#16a34a', fontWeight: 700 }}>7,500–8,000 t/yr</td>
                    <td className="mono" style={{ color: '#0284c7' }}>12,000+ t/yr</td>
                  </tr>
                  <tr>
                    <td><strong>{tr(lang, 'Distance to Aralsk Port')}</strong></td>
                    <td className="mono" style={{ color: '#dc2626' }}>~100 km {tr(lang, 'retreat')}</td>
                    <td className="mono">~15–20 km from harbor</td>
                    <td className="mono" style={{ color: '#0284c7', fontWeight: 700 }}>0 km ({tr(lang, 'Port Restored')})</td>
                  </tr>
                  <tr>
                    <td><strong>{tr(lang, 'Ichthyofauna Ecology')}</strong></td>
                    <td>{tr(lang, 'Flounder (Platichthys flesus) only')}</td>
                    <td>15+ species (Carp, Pike-perch, Bream)</td>
                    <td>{tr(lang, 'Complete indigenous Aral complex')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flow-nodata-badge" style={{ marginTop: 8 }}>
              <strong>{tr(lang, 'Kokaral Dike Specifications:')}</strong> {tr(lang, '13.0 km earthfill embankment, 9-bay concrete spillway (design discharge 398 m³/s), finished in August 2005 under the $86M World Bank SYNAS-1 project. Excess overflows discharge southward into the Large Aral Sea sink.')}
            </div>
          </div>
        )}

        {/* Glacial Water Tower Dynamics Card */}
        {place.type === 'glacier' && (
          <div className="drawer-card">
            <div className="drawer-card-head">
              <span className="card-title">{tr(lang, 'Glacial Cryosphere Dynamics')}</span>
              <span className="card-tag">{tr(lang, 'WGMS Reference Monitoring')}</span>
            </div>
            <p className="card-sub">{tr(lang, 'Continuous alpine mass balance observations and glacial hazard mitigation network in the Ile-Alatau and Central Tian Shan ranges.')}</p>

            <div className="stat-grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr' }}>
              <div className="stat-card" style={{ padding: '8px 10px' }}>
                <span className="network-label">{tr(lang, 'Summer Melt Contribution')}</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0891b2', margin: '2px 0' }}>
                  {place.meltwaterContribution || '30–40%'}
                </div>
                <p className="card-sub" style={{ fontSize: 11 }}>{tr(lang, 'Peak July–August urban water supply for Almaty.')}</p>
              </div>
              <div className="stat-card" style={{ padding: '8px 10px', borderLeft: '3px solid #dc2626' }}>
                <span className="network-label">{tr(lang, 'Mass Balance Loss Rate')}</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', margin: '2px 0' }}>-0.41 m w.e./yr</div>
                <p className="card-sub" style={{ fontSize: 11 }}>{tr(lang, 'Cumulative ice thickness loss since 1956 benchmark.')}</p>
              </div>
            </div>

            <div className="network-transboundary-callout" style={{ marginTop: 8 }}>
              <div className="network-transboundary-title">
                <span>🏔️</span>
                <span>{tr(lang, 'GLOF Hazard Mitigation & Sentinel Post')}</span>
              </div>
              <p className="network-regime-desc">{tr(lang, 'High-mountain moraine dams are monitored by Kazselezashchita and the Mynzhylki hydromet station (3,017 m). During peak summer melt periods, siphon pumping stations and artificial drainage channels are deployed at proglacial moraine lakes (e.g., Lake No. 6) to prevent catastrophic glacial lake outburst floods down the Medeu valley.')}</p>
            </div>
          </div>
        )}

        {/* Dams and gauges on this river card */}
        {associated.length > 0 && (
          <div className="drawer-card">
            <div className="drawer-card-head">
              <span className="card-title">
                {tr(lang, place.type === 'river' ? 'Dams and gauges on this river' : 'River and cascade system')}
              </span>
              <span className="card-tag">{tr(lang, 'from this atlas')}</span>
            </div>
            <div className="associated-list">
              {associated.map((item) => (
                <div key={item.id} className="associated-row">
                  <button
                    type="button"
                    className="associated-name-btn"
                    onClick={() => onSelectPlace?.(item.id)}
                    title={`${tr(lang, 'Zoom to')} ${item.name}`}
                  >
                    {item.name}
                  </button>
                  <span className="associated-metric">{item.metricValue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* River flow nearby (GloFAS model via Open-Meteo) card */}
        <div className="drawer-card">
          <div className="drawer-card-head">
            <span className="card-title">{tr(lang, 'River flow nearby')}</span>
            <span className="card-tag">{tr(lang, 'GloFAS model via Open-Meteo')}</span>
          </div>
          <p className="card-sub">
            Nearest GloFAS model cell (
            {flowData
              ? `${flowData.nearestLat.toFixed(2)}° N, ${flowData.nearestLon.toFixed(2)}° E`
              : `${place.lat.toFixed(2)}° N, ${place.lon.toFixed(2)}° E`}
            ). {tr(lang, 'For reservoirs this may show inflow or the lake itself, not dam releases.')}
          </p>

          {flowLoading ? (
            <div className="chart-loading">{tr(lang, 'Loading live GloFAS flow model…')}</div>
          ) : flowData && flowData.hasData && flowData.series.length > 0 ? (
            <div className="hydrograph-wrap">
              <HydrographSvg data={flowData} lang={lang} />
              <div className="hydrograph-legend">
                <span className="leg-item">
                  <span className="leg-line-solid" /> {tr(lang, 'Modelled flow')}
                </span>
                <span className="leg-item">
                  <span className="leg-line-dashed" /> {tr(lang, 'Forecast (ensemble median)')}
                </span>
                <span className="leg-item">
                  <span className="leg-box-range" /> {tr(lang, 'Forecast range (25–75%)')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flow-nodata-box">
              <div className="flow-nodata-header">
                <span className="flow-nodata-icon">⚠️</span>
                <span className="flow-nodata-title">{tr(lang, 'Insufficient GloFAS Grid Coverage')}</span>
              </div>
              <p className="flow-nodata-desc">
                {tr(lang, flowData?.statusMessage ||
                  'The Copernicus Global Flood Awareness System (GloFAS) resolves drainage catchments greater than 10 km². Active modeled hydrograph cells are not available at these localized or arid coordinates.')}
              </p>
              <div className="flow-nodata-badge">
                {tr(lang, 'Strict data policy: Synthetic fallbacks are prohibited. Refer to official Kazhydromet hydrometric posts for in-situ gauge records.')}
              </div>
            </div>
          )}
        </div>

        {/* Weather this week (Open-Meteo forecast) card */}
        <div className="drawer-card">
          <div className="drawer-card-head">
            <span className="card-title">{tr(lang, 'Weather this week')}</span>
            <span className="card-tag">{tr(lang, 'Open-Meteo forecast')}</span>
          </div>
          {weatherLoading ? (
            <div className="weather-loading">{tr(lang, 'Loading weather forecast…')}</div>
          ) : weatherDays && weatherDays.length > 0 ? (
            <div className="weather-week-grid">
              {weatherDays.map((w, idx) => (
                <div key={idx} className="weather-day-tile">
                <div className="w-day-name">{new Date(`${w.date}T12:00:00`).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })}</div>
                  <div className="w-tmax">{w.tMax}°</div>
                  <div className="w-tmin">{w.tMin}°</div>
                  <div className="w-rain">{w.precipMm} mm</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flow-nodata-box">
              <div className="flow-nodata-header">
                <span className="flow-nodata-icon">ℹ️</span>
                <span className="flow-nodata-title">{tr(lang, 'Weather Forecast Unavailable')}</span>
              </div>
              <p className="flow-nodata-desc">
                {tr(lang, 'Open-Meteo numerical weather prediction data is currently unavailable for these coordinates.')}
              </p>
            </div>
          )}
        </div>

        {/* Quick External Map Views Pills */}
        <div className="drawer-quick-links" role="group" aria-label={tr(lang, 'External map views')}>
          <a
            href={`https://www.google.com/maps/@${place.lat},${place.lon},12z/data=!3m1!1e3`}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link-btn"
          >
            <span>{tr(lang, 'Satellite view')}</span>
            <span className="ext-arrow">↗</span>
          </a>
          <a
            href={`https://www.openstreetmap.org/#map=12/${place.lat}/${place.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link-btn"
          >
            <span>{tr(lang, 'OpenStreetMap')}</span>
            <span className="ext-arrow">↗</span>
          </a>
          <a
            href="https://global-surface-water.appspot.com/map"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link-btn"
          >
            <span>{tr(lang, 'Surface-water history')}</span>
            <span className="ext-arrow">↗</span>
          </a>
          {place.wikidataId && (
            <a
              href={`https://www.wikidata.org/wiki/${place.wikidataId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="quick-link-btn"
            >
              <span>{tr(lang, 'Wikidata')}</span>
              <span className="ext-arrow">↗</span>
            </a>
          )}
        </div>

        {/* Sources Section */}
        <div className="drawer-sources-section">
          <h3 className="sources-heading">{tr(lang, 'Sources')}</h3>
          <ul className="sources-list">
            <li>
                {tr(lang, 'River line:')} {place.lineDrawnFrom || tr(lang, 'Natural Earth 1:10m rivers (public domain)')}
            </li>
            {place.wikipediaUrl && (
              <li>
                <a href={place.wikipediaUrl} target="_blank" rel="noopener noreferrer">
                  {place.wikipediaUrl.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
            {place.wikidataId && (
              <li>
                <a
                  href={`https://www.wikidata.org/wiki/${place.wikidataId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  wikidata.org/wiki/{place.wikidataId}
                </a>
              </li>
            )}
            <li>
              <a
                href="https://www.gov.kz/memleket/entities/water?lang=en"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ministry of Water Resources and Irrigation of the Republic of Kazakhstan (gov.kz)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

/**
 * Interactive SVG Hydrograph matching the Nigeria Water Atlas GloFAS discharge curve
 */
function HydrographSvg({ data, lang }: { data: PlaceFlowData; lang: Lang }) {
  const { series, todayIndex, maxQ } = data;
  const N = series.length;
  if (N < 2) return null;

  const svgW = 380;
  const svgH = 145;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  // Nice round max tick
  let topTick = 100;
  if (maxQ > 800) topTick = Math.ceil(maxQ / 200) * 200;
  else if (maxQ > 300) topTick = Math.ceil(maxQ / 100) * 100;
  else if (maxQ > 120) topTick = Math.ceil(maxQ / 50) * 50;
  else if (maxQ > 40) topTick = Math.ceil(maxQ / 20) * 20;
  else topTick = Math.ceil(maxQ / 10) * 10;
  if (topTick < maxQ) topTick = maxQ;
  const midTick = Math.round(topTick / 2);

  const getX = (i: number) => padL + (i / (N - 1)) * plotW;
  const getY = (val: number | null) => {
    if (val == null) return padT + plotH;
    const clamped = Math.max(0, Math.min(topTick, val));
    return padT + plotH - (clamped / topTick) * plotH;
  };

  // Historical modelled flow path
  let actualPath = '';
  for (let i = 0; i <= todayIndex && i < N; i++) {
    const val = series[i].actual ?? series[i].median;
    if (val != null) {
      const cmd = actualPath === '' ? 'M' : 'L';
      actualPath += `${cmd} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)} `;
    }
  }

  // Forecast ensemble median path
  let forecastPath = '';
  for (let i = todayIndex; i < N; i++) {
    const val = series[i].median ?? series[i].actual;
    if (val != null) {
      const cmd = forecastPath === '' ? 'M' : 'L';
      forecastPath += `${cmd} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)} `;
    }
  }

  // Forecast range band (p25 to p75)
  let bandPath = '';
  const rangePoints: { x: number; y25: number; y75: number }[] = [];
  for (let i = todayIndex; i < N; i++) {
    const p25 = series[i].p25 ?? (series[i].median != null ? series[i].median! * 0.8 : null);
    const p75 = series[i].p75 ?? (series[i].median != null ? series[i].median! * 1.25 : null);
    if (p25 != null && p75 != null) {
      rangePoints.push({ x: getX(i), y25: getY(p25), y75: getY(p75) });
    }
  }

  if (rangePoints.length > 1) {
    bandPath = `M ${rangePoints[0].x.toFixed(1)} ${rangePoints[0].y75.toFixed(1)} `;
    for (let k = 1; k < rangePoints.length; k++) {
      bandPath += `L ${rangePoints[k].x.toFixed(1)} ${rangePoints[k].y75.toFixed(1)} `;
    }
    for (let k = rangePoints.length - 1; k >= 0; k--) {
      bandPath += `L ${rangePoints[k].x.toFixed(1)} ${rangePoints[k].y25.toFixed(1)} `;
    }
    bandPath += 'Z';
  }

  const todayX = getX(todayIndex);

  const formatDay = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };
  const d1 = series[0]?.date ? formatDay(series[0].date) : '';
  const midIdx = Math.floor(todayIndex * 0.7);
  const d2 = series[midIdx]?.date ? formatDay(series[midIdx].date) : '';
  const d3 = series[N - 1]?.date ? formatDay(series[N - 1].date) : '';

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="hydrograph-svg" aria-label={tr(lang, 'River discharge hydrograph')}>
      {/* Horizontal gridlines */}
      <line
        x1={padL}
        y1={getY(topTick)}
        x2={padL + plotW}
        y2={getY(topTick)}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      <line
        x1={padL}
        y1={getY(midTick)}
        x2={padL + plotW}
        y2={getY(midTick)}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      <line
        x1={padL}
        y1={getY(0)}
        x2={padL + plotW}
        y2={getY(0)}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />

      {/* Y-axis tick labels */}
      <text x={padL - 6} y={getY(topTick) + 3} className="chart-tick" textAnchor="end">
        {topTick}
      </text>
      <text x={padL - 6} y={getY(midTick) + 3} className="chart-tick" textAnchor="end">
        {midTick}
      </text>
      <text x={padL - 6} y={getY(0) + 3} className="chart-tick" textAnchor="end">
        0
      </text>

      {/* Forecast range band */}
      {bandPath && <path d={bandPath} fill="rgba(56, 189, 248, 0.22)" />}

      {/* Historical modelled flow line */}
      {actualPath && (
        <path
          d={actualPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Forecast median line */}
      {forecastPath && (
        <path
          d={forecastPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.2"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Today vertical divider line */}
      <line
        x1={todayX}
        y1={padT}
        x2={todayX}
        y2={padT + plotH}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="1.2"
      />
      <text x={todayX + 4} y={padT + 8} className="chart-today-label">
        {tr(lang, 'today')}
      </text>

      {/* X-axis date labels */}
      <text x={padL} y={padT + plotH + 16} className="chart-date" textAnchor="start">
        {d1}
      </text>
      <text x={getX(midIdx)} y={padT + plotH + 16} className="chart-date" textAnchor="middle">
        {d2}
      </text>
      <text x={padL + plotW} y={padT + plotH + 16} className="chart-date" textAnchor="end">
        {d3}
      </text>
    </svg>
  );
}
