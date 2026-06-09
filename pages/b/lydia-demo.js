import { useState } from 'react';
import Head from 'next/head';
import BookingPanel from '../../components/BookingPanel';

/*
  LYDIA AKRAM DEMO — "Eid with Summer Breeze"
  This replicates her actual floor plan structure:
  - Row C (top): Fashion Icons — premium with brand logos
  - Row A (bottom): Beauty/Accessory Icons — premium with brand logos  
  - Rows L & R: Standard booths (mass market)
  - Row D: Side beauty icons
  - Row B: Ultra-premium sponsors
  - Sponsors: Fawry, Oranamin C
*/

const BAZAAR = {
  name: 'Eid with Summer Breeze ☀️',
  organizer: 'LA Market — Lydia Akram',
  organizerInsta: '@lydiaakrammarket',
  date: 'June 20-22, 2026',
  time: '4:00 PM — 11:00 PM',
  location: 'Cairo Festival City',
  description: 'Egypt\'s biggest Eid bazaar is back! 3 days of premium fashion, beauty, handmade brands & live entertainment. 240+ curated brands.',
  totalBooths: 264,
  soldBooths: 237,
  zones: {
    fashion_icon: { label: '👗 Fashion Icons', color: '#432319', priceEGP: 25000 },
    beauty_icon: { label: '💄 Beauty Icons', color: '#9b4f27', priceEGP: 18000 },
    sponsor: { label: '⭐ Sponsor Partner', color: '#a78545', priceEGP: 75000 },
    standard_left: { label: '🏪 Standard (Left)', color: '#7a6453', priceEGP: 4000 },
    standard_right: { label: '🏪 Standard (Right)', color: '#7a6453', priceEGP: 4000 },
    yellow_zone: { label: '✨ Premium Standard', color: '#99826a', priceEGP: 6500 },
  },
};

// --- ICON Vendors (Premium booths with brand logos) ---
const FASHION_ICONS = [
  { id: 'C1', brand: 'UpTowels', logo: '🏠' },
  { id: 'C2', brand: 'Familia', logo: '👗' },
  { id: 'C3', brand: 'Clue', logo: '✨' },
  { id: 'C4', brand: 'Simple', logo: '🌸' },
  { id: 'C5', brand: 'Breathe', logo: '🍃' },
  { id: 'C6', brand: 'Veil', logo: '🧕' },
  { id: 'C7', brand: 'Le Maillot', logo: '👙' },
  { id: 'C8', brand: 'Tia Mode', logo: '💃' },
  { id: 'C9', brand: 'Jamila', logo: '💎' },
  { id: 'C10', brand: 'BlackCloset', logo: '🖤' },
  { id: 'C11', brand: 'Jude', logo: '👠' },
  { id: 'C12', brand: 'Buffalo', logo: '🦬' },
  { id: 'C13', brand: 'TGS', logo: '✂️' },
  { id: 'C14', brand: 'Amira El D.', logo: '👑' },
];

const BEAUTY_ICONS = [
  { id: 'A1', brand: 'Noje', logo: '💅' },
  { id: 'A2', brand: 'Capixy', logo: '💇' },
  { id: 'A3', brand: 'Noje', logo: '💅' },
  { id: 'A4', brand: 'Shaan', logo: '🌟' },
  { id: 'A5', brand: 'Clary', logo: '🧴' },
  { id: 'A6', brand: 'Starville', logo: '⭐' },
  { id: 'A7', brand: 'Bobai', logo: '🧸' },
  { id: 'A8', brand: 'MY-M', logo: '💜' },
  { id: 'A9', brand: 'Joo Shades', logo: '🕶️' },
  { id: 'A10', brand: 'Madad', logo: '🌿' },
  { id: 'A11', brand: 'Leap', logo: '🚀' },
  { id: 'A12', brand: 'Sweetal', logo: '🍬' },
  { id: 'A13', brand: 'ExMart', logo: '🛒' },
  { id: 'A14', brand: 'Oranamin C', logo: '🍊', isSponsor: true },
  { id: 'A15', brand: 'Bohartna', logo: '🌺' },
  { id: 'A16', brand: 'Haj Arafa', logo: '🌿' },
  { id: 'A17', brand: 'Fawry', logo: '💳', isSponsor: true },
];

const SIDE_ICONS = [
  { id: 'B1', brand: 'MYVI', logo: '💎' },
  { id: 'B2', brand: 'Infinity', logo: '♾️' },
  { id: 'B3', brand: 'Skinify', logo: '✨' },
  { id: 'D1', brand: 'Kolagra', logo: '💧' },
  { id: 'D2', brand: 'Altesse', logo: '👸' },
  { id: 'D3', brand: 'Skinova', logo: '🧬' },
  { id: 'D4', brand: 'Trindiva', logo: '💄' },
  { id: 'D5', brand: 'Dermactive', logo: '🔬' },
];

// Generate standard booth rows
function generateStandardRows(side, startNum, rowCount, colCount) {
  const rows = [];
  let num = startNum;
  for (let r = 0; r < rowCount; r++) {
    const row = [];
    for (let c = 0; c < colCount; c++) {
      const isYellowZone = r >= 5 && r <= 6;
      const isSold = Math.random() > 0.12;
      row.push({
        id: `${num}`,
        zone: isYellowZone ? 'yellow_zone' : (side === 'L' ? 'standard_left' : 'standard_right'),
        status: isSold ? 'sold' : 'available',
        vendor: isSold ? '' : '',
      });
      num++;
    }
    rows.push(row);
  }
  return rows;
}

const leftRows = generateStandardRows('L', 16, 15, 8);
const rightRows = generateStandardRows('R', 1, 15, 8);

export default function LydiaDemo() {
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const boothsLeft = BAZAAR.totalBooths - BAZAAR.soldBooths;
  const occupancyPercent = Math.round((BAZAAR.soldBooths / BAZAAR.totalBooths) * 100);

  const handleBoothClick = (booth) => {
    setSelectedBooth(booth);
    setIsPanelOpen(true);
  };

  return (
    <>
      <Head>
        <title>{`${BAZAAR.name} — Book Your Booth | The Grid, by SHYY`}</title>
        <meta name="description" content={BAZAAR.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`${BAZAAR.name} — Only ${boothsLeft} booths left!`} />
        <meta property="og:description" content={`${BAZAAR.date} at ${BAZAAR.location}. ${BAZAAR.soldBooths}/${BAZAAR.totalBooths} booths sold.`} />
      </Head>

      {/* Real Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(247, 245, 240, 0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px var(--space-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(44, 30, 22, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/la-logo.jpg" alt="LA Market Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1.2 }}>LA Market</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Powered by The Grid <span style={{ fontSize: '0.45rem', opacity: 0.7 }}>by SHYY</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            🔥 {boothsLeft} left
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => {
            const mapEl = document.querySelector('.map-container');
            if (mapEl) window.scrollTo({ top: mapEl.offsetTop - 100, behavior: 'smooth' });
          }}>
            Book Booth
          </button>
        </div>
      </header>

      <main className="page" style={{ paddingTop: 'var(--space-lg)' }}>
        <div className="container">

          {/* Hero Section */}
          <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '6px 20px', borderRadius: '20px', fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '24px' }}>
              Exclusive Booking Portal
            </div>
            <h1 style={{ marginBottom: '16px', fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>{BAZAAR.name}</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '16px auto 24px', maxWidth: '600px', lineHeight: 1.6 }}>{BAZAAR.description}</p>

            {/* Event Info Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {[
                `📅 ${BAZAAR.date}`, `🕐 ${BAZAAR.time}`, 
                `📍 ${BAZAAR.location}`, `📸 ${BAZAAR.organizerInsta}`
              ].map((text, i) => (
                <div key={i} style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  fontSize: '0.82rem', color: 'var(--text-primary)',
                }}>{text}</div>
              ))}
            </div>

            {/* FOMO Counter */}
            <div className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--color-accent)' }}>{BAZAAR.soldBooths}</strong>/{BAZAAR.totalBooths} booths sold
                </span>
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  🔥 Only {boothsLeft} left!
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                <div style={{
                  width: `${occupancyPercent}%`, height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg, var(--color-warning), var(--color-accent))',
                }} />
              </div>
            </div>
          </div>

          {/* Zone Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
            {Object.entries(BAZAAR.zones).map(([key, zone]) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 16px', borderRadius: '24px',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: zone.color }}></span>
                {zone.label} <span style={{ color: 'var(--text-muted)' }}>— {zone.priceEGP.toLocaleString()} EGP</span>
              </div>
            ))}
          </div>

          {/* ======================== THE FLOOR PLAN ======================== */}
          <div className="map-container" style={{ padding: '20px', overflow: 'auto' }}>

            {/* === ROW C: FASHION ICONS (Top Premium Row) === */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px', textAlign: 'center' }}>
                FASHION ICONS — PREMIUM ROW
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${FASHION_ICONS.length}, 1fr)`, gap: '8px' }}>
                {FASHION_ICONS.map(icon => (
                  <div key={icon.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 4px', borderRadius: '12px', minHeight: '85px',
                    background: 'var(--bg-card)', border: '1px solid transparent',
                    boxShadow: 'var(--shadow-sm)', cursor: 'default', textAlign: 'center',
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                      {icon.brand.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{icon.id}</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>{icon.brand}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* === STANDARD BOOTHS: LEFT (L) & RIGHT (R) side by side === */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '0', margin: '12px 0' }}>
              
              {/* Left Block */}
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>LEFT BLOCK (L1-L15)</div>
                {leftRows.map((row, ri) => (
                  <div key={`L${ri}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: '6px', marginBottom: '6px' }}>
                    {row.map((booth, ci) => {
                      const isYellow = booth.zone === 'yellow_zone';
                      const isAvail = booth.status === 'available';
                      const isSelected = selectedBooth?.id === booth.id;
                      return (
                        <div key={`L${ri}-${ci}`}
                          onClick={() => handleBoothClick({ ...booth, type: 'booth' })}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '36px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                            cursor: 'pointer',
                            background: isSelected ? 'var(--booth-selected-bg)' : isAvail ? (isYellow ? 'var(--bg-secondary)' : 'var(--bg-card)') : 'rgba(0,0,0,0.03)',
                            border: isSelected ? '1px solid var(--color-primary)' : isAvail ? `1px solid transparent` : '1px solid transparent',
                            color: isSelected ? 'var(--booth-selected-text)' : isAvail ? 'var(--text-primary)' : 'rgba(0,0,0,0.25)',
                            opacity: 1,
                            transition: 'all 0.2s ease',
                            transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            boxShadow: isSelected ? 'var(--shadow-md)' : isAvail ? 'var(--shadow-sm)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                          }}
                        >
                          {booth.id}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Central Walkway */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                writingMode: 'vertical-rl', textOrientation: 'mixed',
                fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '8px',
                borderLeft: 'none', borderRight: 'none', opacity: 0.5,
              }}>
                WALKWAY
              </div>

              {/* Right Block */}
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>RIGHT BLOCK (R1-R15)</div>
                {rightRows.map((row, ri) => (
                  <div key={`R${ri}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: '6px', marginBottom: '6px' }}>
                    {row.map((booth, ci) => {
                      const isYellow = booth.zone === 'yellow_zone';
                      const isAvail = booth.status === 'available';
                      const isSelected = selectedBooth?.id === `R${booth.id}`;
                      const boothData = { ...booth, id: `R${booth.id}` };
                      return (
                        <div key={`R${ri}-${ci}`}
                          onClick={() => handleBoothClick({ ...boothData, type: 'booth' })}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '36px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                            cursor: 'pointer',
                            background: isSelected ? 'var(--booth-selected-bg)' : isAvail ? (isYellow ? 'var(--bg-secondary)' : 'var(--bg-card)') : 'rgba(0,0,0,0.03)',
                            border: isSelected ? '1px solid var(--color-primary)' : isAvail ? `1px solid transparent` : '1px solid transparent',
                            color: isSelected ? 'var(--booth-selected-text)' : isAvail ? 'var(--text-primary)' : 'rgba(0,0,0,0.25)',
                            opacity: 1,
                            transition: 'all 0.2s ease',
                            transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            boxShadow: isSelected ? 'var(--shadow-md)' : isAvail ? 'var(--shadow-sm)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                          }}
                        >
                          {booth.id}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* === SIDE ICONS: B (left) and D (right) === */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', gap: '24px', margin: '24px 0' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>B ROW</div>
                {SIDE_ICONS.filter(i => i.id.startsWith('B')).map(icon => (
                  <div key={icon.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', marginBottom: '8px', borderRadius: '12px',
                    background: 'var(--bg-card)', border: '1px solid transparent', boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.7rem',
                  }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      {icon.brand.charAt(0)}
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{icon.id}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>{icon.brand}</span>
                  </div>
                ))}
              </div>
              <div></div>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>D ROW</div>
                {SIDE_ICONS.filter(i => i.id.startsWith('D')).map(icon => (
                  <div key={icon.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', marginBottom: '8px', borderRadius: '12px',
                    background: 'var(--bg-card)', border: '1px solid transparent', boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.7rem',
                  }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      {icon.brand.charAt(0)}
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{icon.id}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>{icon.brand}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* === ROW A: BEAUTY ICONS (Bottom Premium Row near Gates) === */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px', textAlign: 'center' }}>
                BEAUTY & PARTNER ICONS — GATE ROW
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BEAUTY_ICONS.length}, 1fr)`, gap: '8px' }}>
                {BEAUTY_ICONS.map(icon => (
                  <div key={icon.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 4px', borderRadius: '12px', minHeight: '85px',
                    background: 'var(--bg-card)', border: '1px solid transparent', boxShadow: 'var(--shadow-sm)',
                    cursor: 'default', textAlign: 'center',
                  }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                      {icon.brand.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{icon.id}</span>
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50px' }}>{icon.brand}</span>
                    {icon.isSponsor && <span style={{ fontSize: '0.45rem', color: '#a78545', marginTop: '1px' }}>SPONSOR</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Gates */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px' }}>
              <div style={{ padding: '10px 40px', background: 'transparent', borderBottom: '2px solid var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '4px', textTransform: 'uppercase' }}>
                GATE 1
              </div>
              <div style={{ padding: '10px 40px', background: 'transparent', borderBottom: '2px solid var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '4px', textTransform: 'uppercase' }}>
                GATE 2
              </div>
            </div>
          </div>

          {/* ======================== VENDOR DIRECTORY ======================== */}
          <div style={{ marginTop: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-md)' }}>📋 Vendor Directory</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Fashion Icons */}
              <div style={{ padding: 'var(--space-md)' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  👗 Fashion Icons
                </h3>
                {FASHION_ICONS.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{v.brand}</span>
                    <span style={{ fontWeight: 600, color: '#432319' }}>{v.id}</span>
                  </div>
                ))}
              </div>

              {/* Beauty Icons */}
              <div style={{ padding: 'var(--space-md)' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  💄 Beauty Icons
                </h3>
                {BEAUTY_ICONS.filter(v => !v.isSponsor).map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{v.brand}</span>
                    <span style={{ fontWeight: 600, color: '#9b4f27' }}>{v.id}</span>
                  </div>
                ))}
              </div>

              {/* Sponsors */}
              <div style={{ padding: 'var(--space-md)' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  ⭐ Partners & Sponsors
                </h3>
                {[...BEAUTY_ICONS.filter(v => v.isSponsor), ...SIDE_ICONS].map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{v.brand}</span>
                    <span style={{ fontWeight: 600, color: '#a78545' }}>{v.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', marginTop: 'var(--space-xl)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '8px' }}>Want a booth at this bazaar?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Click any green booth on the map above. Only {boothsLeft} spots remaining.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              ⬆ Back to Map
            </button>
          </div>
        </div>
      </main>

      {/* Booking Panel */}
      <BookingPanel
        booth={selectedBooth}
        bazaarZones={BAZAAR.zones}
        isOpen={isPanelOpen}
        onClose={() => { setIsPanelOpen(false); setTimeout(() => setSelectedBooth(null), 300); }}
        onConfirm={(b) => alert(`Redirecting to Paymob for booth ${b.id}...`)}
      />

      <footer style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>Powered by <strong style={{ color: 'var(--text-secondary)' }}>BAZAAR-OS</strong> — <a href="/">Create your own bazaar</a></p>
      </footer>
    </>
  );
}
