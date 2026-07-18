import { useState, useEffect } from 'react';
import Head from 'next/head';
import BookingPanel from '../../components/BookingPanel';
import { getEventBySlug, subscribeToEvent } from '../../utils/eventService';
import { PHASES } from '../../utils/bookingEngine';

// ── Priority booking deadline countdown ──
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate);
    const calc = () => {
      const diff = target - new Date();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        expired: false,
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 60000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

// ── Block Generator (with varied statuses for visual clarity) ──
function generateBlock(prefix, startNum, count, zone, isPriority = false, isSoldOut = false) {
  return Array.from({ length: count }, (_, i) => {
    const num = startNum + i;
    let status = 'available';
    if (num % 4 === 0) status = 'sold';
    if (!isPriority && num % 7 === 0) status = 'pending';
    if (isSoldOut) status = 'sold';
    return {
      id: `${prefix}${num}`,
      zone,
      status,
      brand: status === 'sold' ? `Brand ${prefix}${num}` : null,
    };
  });
}

// ── Build grid rows from floor plan config ──
function buildGridRows(floorPlan, isPriority = false, isSoldOut = false) {
  if (!floorPlan) return { rows: [], rowA: [] };

  const rowKeys = ['rowB5', 'rowB4', 'rowB3', 'rowB2', 'rowB1'];
  const rows = rowKeys.map(key => {
    const rowConfig = floorPlan[key];
    if (!rowConfig || !rowConfig.blocks) return [];
    return rowConfig.blocks.map(b => generateBlock(b.prefix, b.start, b.count, b.zone, isPriority, isSoldOut));
  });

  const rowAConfig = floorPlan.rowA;
  let rowA = [];
  if (rowAConfig) {
    rowA = generateBlock(rowAConfig.prefix, rowAConfig.start, rowAConfig.count, rowAConfig.zone, isPriority, isSoldOut);
    if (rowAConfig.reverse) rowA = rowA.reverse();
  }

  return { rows, rowA };
}

/*
  BAZAAR-OS — Dynamic Event Booking Page
  ========================================
  Loads event data from Firestore (or localStorage demo mode).
  Route: /b/[eventSlug]
  
  Each organizer gets their own branded page with:
  - Custom accent color, logo, event details
  - Interactive floor plan with booth selection
  - Two-phase booking system (priority → waitlist)
*/

export async function getServerSideProps({ params }) {
  const event = await getEventBySlug(params.eventSlug);
  if (!event) return { notFound: true };
  return { props: { event: JSON.parse(JSON.stringify(event)) } };
}

export default function EventBookingPage({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [reservedBoothInfo, setReservedBoothInfo] = useState(null);
  const [globalHover, setGlobalHover] = useState(null);

  const handleGlobalMouseEnter = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlobalHover({ text, x: rect.left + rect.width / 2, y: rect.top });
  };
  const handleGlobalMouseLeave = () => setGlobalHover(null);

  useEffect(() => {
    if (!event) return;

    // Inject brand accent as CSS custom properties
    document.documentElement.style.setProperty('--brand-accent', event.brandAccent || '#8B5E3C');
    document.documentElement.style.setProperty('--brand-accent-light', event.brandAccentLight || '#F6F0EB');

    // Subscribe to real-time event changes (phase changes from admin)
    const unsub = subscribeToEvent(event.id, (updated) => {
      setEvent(prev => ({ ...prev, ...updated }));
    });

    // If a payment link, auto-open panel
    const params = new URLSearchParams(window.location.search);
    const payBoothId = params.get('pay');
    if (payBoothId) {
      let zone = 'standard_left';
      if (payBoothId.startsWith('C') || payBoothId.startsWith('A')) zone = 'fashion_icon';
      if (payBoothId.startsWith('D') || payBoothId.startsWith('L')) zone = 'yellow_zone';
      setSelectedBooth({ id: payBoothId, zone, status: 'pending', type: 'booth' });
      setIsPanelOpen(true);
    }

    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  if (!event) return null;

  const currentPhase = event.currentPhase || PHASES.PRIORITY_BOOKING;
  const isPriority = currentPhase === PHASES.PRIORITY_BOOKING;
  const isSoldOut = currentPhase === PHASES.SOLD_OUT;
  const countdown = useCountdown(event.priorityDeadline);
  const totalCount = event.totalBooths || 264;
  const soldCount = isSoldOut ? totalCount : (event.soldBooths || 237);
  const boothsLeft = totalCount - soldCount;
  const occupancyPercent = Math.round((soldCount / totalCount) * 100);

  const mapIconStatus = (icon) => {
    if (isSoldOut) return { ...icon, status: 'sold' };
    if (isPriority && icon.status === 'pending') return { ...icon, status: 'sold' };
    return icon;
  };
  const FASHION_ICONS = (event.fashionIcons || []).map(mapIconStatus);
  const BEAUTY_ICONS = (event.beautyIcons || []).map(mapIconStatus);
  const SIDE_ICONS = (event.sideIcons || []).map(mapIconStatus);

  const { rows: gridRows, rowA } = buildGridRows(event.floorPlan, isPriority, isSoldOut);

  const handleBoothClick = (booth) => {
    if (booth.status === 'sold' || booth.status === 'pending') {
      setReservedBoothInfo(booth);
      return;
    }
    setSelectedBooth(booth);
    setIsPanelOpen(true);
  };

  // ── Booth Status Colors ──
  const getBoothStyles = (booth, isFood = false) => {
    const isPending = booth.status === 'pending';
    const isSelected = selectedBooth?.id === booth.id;
    const isSold = booth.status === 'sold';
    const isYellow = booth.zone === 'yellow_zone';

    if (isSelected) return {
      background: 'var(--booth-selected-bg)',
      border: '2px solid var(--booth-selected-border)',
      color: 'var(--booth-selected-text)',
    };
    if (isPending) return {
      background: 'var(--booth-pending-bg)',
      border: '1.5px dashed var(--booth-pending-border)',
      color: 'var(--booth-pending-text)',
    };
    if (isSold) return {
      background: 'var(--booth-sold-bg)',
      border: '1px solid var(--booth-sold-border)',
      color: 'var(--booth-sold-text)',
    };
    if (isFood) {
      return {
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.7)',
      };
    }
    return {
      background: isYellow ? 'var(--color-gold)' : 'var(--booth-available-bg)',
      border: '1px solid ' + (isYellow ? 'var(--color-gold)' : 'var(--booth-available-border)'),
      color: isYellow ? '#FFFFFF' : 'var(--booth-available-text)',
    };
  };

  const renderBooth = (booth, isFood = false) => {
    const isAvail = booth.status === 'available';
    const isPending = booth.status === 'pending';
    const isSelected = selectedBooth?.id === booth.id;
    const isSold = booth.status === 'sold';
    const styles = getBoothStyles(booth, isFood);

    return (
      <div key={booth.id}
        className={`booth-card ${isAvail ? 'available' : ''} ${isSelected ? 'selected' : ''} ${isPending ? 'booth-status-pending' : ''}`}
        onClick={() => handleBoothClick({ ...booth, type: 'booth' })}
        onMouseEnter={(e) => handleGlobalMouseEnter(e, isSold ? (booth.brand || 'Reserved') : isPending ? 'Pending' : `${booth.id} — Available`)}
        onMouseLeave={handleGlobalMouseLeave}
        style={{
          display: 'flex', flexDirection: isFood ? 'column' : 'row', alignItems: 'center', justifyContent: 'center',
          height: isFood ? '48px' : '28px', borderRadius: '5px', fontSize: isFood ? '0.62rem' : '0.58rem', fontWeight: 500,
          fontFamily: 'var(--font-display)', cursor: 'pointer', position: 'relative',
          letterSpacing: '0.02em',
          ...styles,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span>{booth.id}</span>
        {isFood && !isSold && !isPending && (
          <span style={{ fontSize: '0.4rem', opacity: 0.4, marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Food</span>
        )}
      </div>
    );
  };

  const renderPremiumIcon = (icon) => {
    const isSold = icon.status === 'sold';
    const isPending = icon.status === 'pending';
    const hasLogo = !!icon.logo;

    return (
      <div key={icon.id} className="premium-icon" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '6px 4px', borderRadius: 'var(--radius-sm)',
        background: isPending ? '#FFF8EB' : isSold ? '#E5DFD7' : 'var(--booth-available-bg)',
        border: isPending ? '1.5px dashed #D4AF37' : isSold ? '1px solid #C8BFB5' : '1px solid var(--booth-available-border)',
        cursor: 'pointer', minWidth: 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
      onClick={() => handleBoothClick({ id: icon.id, zone: 'fashion_icon', status: icon.status, type: 'booth' })}
      onMouseEnter={(e) => handleGlobalMouseEnter(e, isSold ? icon.brand : isPending ? 'Pending' : 'Available')}
      onMouseLeave={handleGlobalMouseLeave}
      >
        {hasLogo && isSold ? (
          <img
            src={`/logos/${icon.logo}`}
            alt={icon.brand}
            className="booth-logo"
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: '0.5rem', fontWeight: 600, color: isPending ? '#8C6228' : isSold ? '#7A6E65' : 'var(--text-primary)', letterSpacing: '0.02em' }}>{icon.id}</span>
        )}
        <span style={{ fontSize: '0.36rem', color: isPending ? '#8C6228' : isSold ? '#7A6E65' : 'var(--text-secondary)', marginTop: '1px', textAlign: 'center', lineHeight: 1.2, maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
          {isPending ? 'Pending' : icon.brand || 'Available'}
        </span>
      </div>
    );
  };

  const brandAccent = event.brandAccent || '#8B5E3C';
  const brandAccentLight = event.brandAccentLight || '#F6F0EB';

  return (
    <>
      <Head>
        <title>{`${event.name}: ${event.edition || ''} — Book Your Booth | The Grid, by SHYY`}</title>
        <meta name="description" content={event.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`${event.name} — Only ${boothsLeft} booths left!`} />
        <meta property="og:description" content={`${event.date} at ${event.location}. ${event.soldBooths || 0}/${event.totalBooths || 0} booths sold.`} />
      </Head>

      {/* ═══ Minimal Header with Brand Accent ═══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250, 250, 250, 0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `2px solid ${brandAccent}`,
        padding: '12px var(--space-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {event.logoUrl ? (
            <img src={event.logoUrl} alt={event.organizer} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: brandAccent, flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>{event.organizer}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 400, textTransform: 'uppercase' }}>
              Powered by The Grid
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSoldOut ? (
            <span className="phase-badge" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid rgba(192, 57, 43, 0.15)' }}>Sold Out</span>
          ) : isPriority ? (
            <span className="phase-badge" style={{ background: brandAccentLight, color: brandAccent, border: `1px solid ${brandAccent}22` }}>Priority Access</span>
          ) : (
            <span className="phase-badge phase-waitlist">Applications Open</span>
          )}
          {!isSoldOut && (
            <button className="btn btn-sm" style={{ background: brandAccent, color: '#fff', border: 'none' }} onClick={() => {
              const el = document.querySelector('.map-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              {isPriority ? 'Reserve' : 'Apply'}
            </button>
          )}
        </div>
      </header>

      <main className="page" style={{ paddingTop: 'var(--space-xl)' }}>
        <div className="container">

          {/* ═══ Hero Section — Editorial Two-Column ═══ */}
          <div className="animate-in" style={{ marginBottom: 'var(--space-2xl)', width: '100%' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '40px',
              marginBottom: '24px'
            }}>
              {/* Left Column: Title & Description */}
              <div style={{ flex: '1 1 480px', maxWidth: '640px' }}>
                <div style={{
                  fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase',
                  fontWeight: 600, color: 'var(--text-muted)', marginBottom: '20px',
                }}>
                  {isSoldOut ? 'Event Sold Out' : isPriority ? 'Exclusive Invitation' : 'Open Applications'}
                </div>

                <h1 style={{ marginBottom: '8px', lineHeight: 1.05 }}>
                  {event.name}
                </h1>
                {event.edition && (
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                    color: 'var(--text-muted)', fontWeight: 300, fontStyle: 'italic',
                    marginBottom: '24px',
                  }}>
                    {event.edition}
                  </div>
                )}

                <p style={{ color: 'var(--text-secondary)', marginBottom: 0, lineHeight: 1.8, fontSize: '0.92rem' }}>
                  {isSoldOut
                    ? `All booths for ${event.name} have been reserved. Thank you to everyone who applied. Join our mailing list for future events.`
                    : isPriority
                      ? 'Welcome back. As a verified returning brand, you can select your booth and pay directly to secure your spot.'
                      : 'Apply for a booth. Submit your brand details and we\'ll review your application within 24 hours.'
                  }
                </p>
              </div>

              {/* Right Column: Details & Occupancy Card (Wider Shape) */}
              <div style={{
                flex: '1 1 460px',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                background: 'var(--bg-card)',
                padding: '36px 40px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                minWidth: '360px',
                maxWidth: '600px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Date</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {(event.date || '').split(' ').map((word, i) => <span key={i}>{word} </span>)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Time</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {event.time}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Location</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {event.locationShort || event.location}
                    </div>
                  </div>
                </div>

                {/* Occupancy Bar Inside Details Card */}
                <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Booths Sold</div>
                      <div>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', lineHeight: 1 }}>{event.soldBooths || 0}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '4px' }}>/ {event.totalBooths || 0}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: brandAccent, marginBottom: '4px', fontWeight: 600 }}>Available</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: brandAccent, lineHeight: 1 }}>{boothsLeft}</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${occupancyPercent}%`, height: '100%', borderRadius: '3px',
                      background: `linear-gradient(90deg, ${brandAccent}, ${brandAccent}CC)`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Zone Legend — Center Aligned Row ═══ */}
          {event.zones && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', alignItems: 'center',
              padding: '16px 0', borderBottom: '1px solid var(--border-color)',
              marginBottom: 'var(--space-xl)', width: '100%',
            }}>
              {Object.entries(event.zones)
                .filter(([key]) => key !== 'standard_right')
                .map(([key, zone]) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.75rem', color: 'var(--text-secondary)',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', background: zone.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{zone.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                    {zone.priceEGP >= 1000 ? `${zone.priceEGP / 1000}k` : zone.priceEGP} EGP
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ THE FLOOR PLAN ═══ */}
          <div className="map-section" style={{ scrollMarginTop: '80px' }}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Floor Plan</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isPriority ? 'Select any available booth to reserve it directly' : 'Select any available booth to apply'}
              </p>
            </div>

            {/* Status Legend */}
            <div className="map-legend-bar" style={{ marginBottom: '20px' }}>
              {!isSoldOut && (
                <div className="map-legend-item">
                  <div className="map-legend-dot" style={{ background: 'var(--booth-available-bg)', border: '1px solid var(--booth-available-border)' }} />
                  Available
                </div>
              )}
              <div className="map-legend-item">
                <div className="map-legend-dot" style={{ background: 'var(--color-gold)', border: '1px solid #B58D43' }} />
                Premium
              </div>
              {!isPriority && !isSoldOut && (
                <div className="map-legend-item">
                  <div className="map-legend-dot" style={{ background: 'var(--booth-pending-bg)', border: '1.5px dashed var(--booth-pending-border)' }} />
                  Pending
                </div>
              )}
              <div className="map-legend-item">
                <div className="map-legend-dot" style={{ background: 'var(--booth-sold-bg)', border: '1px solid var(--booth-sold-border)' }} />
                Reserved
              </div>
            </div>

            <div className="map-container" style={{ padding: '24px', overflow: 'auto' }}>
              {/* Row C: Fashion Icons */}
              {FASHION_ICONS.length > 0 && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', marginTop: '12px' }}>
                  <div style={{ width: '36px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${FASHION_ICONS.length}, 1fr)`, gap: '3px' }}>
                    {FASHION_ICONS.map((icon) => renderPremiumIcon(icon))}
                  </div>
                  <div style={{ width: '36px', flexShrink: 0 }} />
                </div>
              )}

              {/* Main Blocks */}
              {gridRows.length > 0 && (
                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* Left Labels */}
                  <div style={{ width: '36px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {['B5', 'B4', 'B3', 'B2', 'B1'].map(b => (
                      <div key={b} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.58rem', fontWeight: 600,
                        color: 'var(--text-muted)', letterSpacing: '0.04em',
                      }}>{b}</div>
                    ))}
                  </div>

                  {/* Center Grid */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {gridRows.map((row, rIdx) => (
                      <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {row.map((block, bIdx) => (
                          <div key={bIdx} style={{
                            display: 'grid',
                            gridTemplateColumns: block.length > 6 ? 'repeat(6, 1fr)' : 'repeat(3, 1fr)',
                            gap: '3px',
                          }}>
                            {block.map(booth => renderBooth(booth))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Right Labels */}
                  <div style={{ width: '36px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {['D1', 'D2', 'D3'].map(d => (
                      <div key={d} style={{
                        height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.58rem', fontWeight: 600,
                        color: 'var(--text-muted)', letterSpacing: '0.04em',
                      }}>{d}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row A: Beauty Icons */}
              {BEAUTY_ICONS.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BEAUTY_ICONS.length}, 1fr)`, gap: '3px', marginBottom: '8px' }}>
                    {BEAUTY_ICONS.map((icon) => renderPremiumIcon(icon))}
                  </div>
                </div>
              )}


              {/* Food Market */}
              {event.floorPlan?.foodArea && (
                <div style={{
                  background: '#1A1A1A',
                  borderRadius: 'var(--radius-lg)', padding: '28px 32px',
                  marginTop: '20px', color: 'var(--text-inverse)', position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '2px', textTransform: 'uppercase' }}>Gate C</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '2px', textTransform: 'uppercase' }}>Gate D</div>
                  </div>

                  <h3 style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '0.78rem', marginBottom: '24px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-display)', fontWeight: 500, textTransform: 'uppercase' }}>
                    Food Market
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {(event.floorPlan.foodArea.rows || []).map((foodRow, fi) => (
                      <div key={fi} style={{ display: 'grid', gridTemplateColumns: `repeat(${foodRow.count}, 1fr)`, gap: '8px' }}>
                        {generateBlock(foodRow.prefix, foodRow.start, foodRow.count, foodRow.zone, isPriority, isSoldOut).map(b => renderBooth(b, true))}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <div style={{
                      flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)', border: '1px dashed rgba(255, 255, 255, 0.1)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Kids Area</div>
                      <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}>Activities & Entertainment</div>
                    </div>
                    <div style={{
                      flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)', border: '1px dashed rgba(255, 255, 255, 0.1)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Photo Zone</div>
                      <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}>Instagram-ready backdrops</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Brand Directory ═══ */}
          <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.3rem' }}>Brand Directory</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Fashion Icons', items: FASHION_ICONS },
                { title: 'Beauty Icons', items: BEAUTY_ICONS },
                { title: 'Partners & Sponsors', items: SIDE_ICONS },
              ].filter(s => s.items.length > 0).map((section) => (
                <div key={section.title} style={{
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)', padding: '24px',
                }}>
                  <h3 style={{
                    fontSize: '0.78rem', marginBottom: '16px',
                    paddingBottom: '12px', borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {section.title}
                  </h3>
                  {section.items.map(v => (
                    <div key={v.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', fontSize: '0.82rem',
                      borderBottom: '1px solid var(--bg-secondary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {v.logo && (
                          <img
                            src={`/logos/${v.logo}`}
                            alt={v.brand}
                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <span style={{ color: 'var(--text-secondary)' }}>{v.brand}</span>
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.68rem' }}>{v.id}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ═══ CTA ═══ */}
          {!isSoldOut && (
            <div style={{
              textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)',
              marginTop: 'var(--space-xl)',
            }}>
              <h2 style={{ marginBottom: '12px', fontSize: '1.6rem' }}>
                {isPriority ? 'Reserve Your Booth' : 'Want a booth?'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 28px' }}>
                {isPriority
                  ? `${boothsLeft} booths remaining for priority access.`
                  : `Apply and we'll review your application within 24 hours.`
                }
              </p>
              <button className="btn btn-lg" style={{ background: brandAccent, color: '#fff', border: 'none' }} onClick={() => {
                const el = document.querySelector('.map-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                Go to Floor Plan
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ═══ Booking Panel ═══ */}
      <BookingPanel
        booth={selectedBooth}
        bazaarZones={event.zones}
        isOpen={isPanelOpen}
        onClose={() => { setIsPanelOpen(false); setTimeout(() => setSelectedBooth(null), 300); }}
        onConfirm={(b) => alert(`Processing booth ${b.id}...`)}
        bazaarPhase={isPriority ? 'priority' : 'waitlist'}
        eventId={event.id}
        brandAccent={brandAccent}
      />

      {/* ═══ Reserved Booth Popup ═══ */}
      <div className={`booking-panel-overlay ${reservedBoothInfo ? 'open' : ''}`} onClick={() => setReservedBoothInfo(null)} style={{ zIndex: 300 }} />
      <div className={`booking-panel ${reservedBoothInfo ? 'open' : ''}`} style={{ maxWidth: '380px', padding: '40px', textAlign: 'center', alignItems: 'center', zIndex: 301 }}>
        <button className="booking-panel-close" onClick={() => setReservedBoothInfo(null)}>✕</button>

        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: reservedBoothInfo?.status === 'pending' ? 'var(--booth-pending-bg)' : 'var(--bg-secondary)',
          border: reservedBoothInfo?.status === 'pending' ? '1.5px dashed var(--booth-pending-border)' : '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '24px',
          color: reservedBoothInfo?.status === 'pending' ? 'var(--booth-pending-text)' : 'var(--text-primary)'
        }}>
          {reservedBoothInfo?.status === 'pending' ? '⏳' : '🔒'}
        </div>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontWeight: 400 }}>
          {reservedBoothInfo?.status === 'pending' ? 'Application Pending' : 'Already Reserved'}
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '28px' }}>
          {reservedBoothInfo?.status === 'pending' ? (
            <>An application is currently under review for <strong style={{ color: 'var(--text-primary)' }}>Booth {reservedBoothInfo?.id}</strong>. Please select an available booth or check back later if this slot opens up.</>
          ) : (
            <>This booth has been officially reserved by <strong style={{ color: 'var(--text-primary)' }}>{reservedBoothInfo?.brand || 'another brand'}</strong>. Please select an available booth.</>
          )}
        </p>

        <button className="btn btn-primary btn-block" onClick={() => setReservedBoothInfo(null)}>
          Choose an available booth
        </button>
      </div>

      {/* ═══ Global Hover Tooltip ═══ */}
      {globalHover && (
        <div style={{
          position: 'fixed',
          left: globalHover.x,
          top: globalHover.y - 8,
          transform: 'translate(-50%, -100%)',
          background: '#111',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-primary)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          fontWeight: 500,
        }}>
          {globalHover.text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '4px',
            borderStyle: 'solid',
            borderColor: '#111 transparent transparent transparent',
          }} />
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <footer style={{
        padding: '32px var(--space-lg)', textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)', fontSize: '0.72rem',
        letterSpacing: '0.04em',
      }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: brandAccent, margin: '0 auto 12px' }} />
        Powered by <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>The Grid</span> by SHYY
      </footer>
    </>
  );
}
