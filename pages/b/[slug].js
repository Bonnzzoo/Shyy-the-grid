import { useState } from 'react';
import Head from 'next/head';
import BoothMap from '../../components/BoothMap';
import BookingPanel from '../../components/BookingPanel';

// In production, this would come from Supabase via getServerSideProps
const DEMO_BAZAAR = {
  id: 'demo',
  slug: 'demo',
  name: 'Ramadan Night Bazaar ✨',
  organizer: 'Events by Mariam',
  organizerInsta: '@eventsby.mariam',
  date: 'July 15-17, 2026',
  time: '5:00 PM — 11:00 PM',
  location: 'The Waterway, New Cairo',
  description: 'Cairo\'s biggest Ramadan bazaar is back! 3 nights of food, fashion, handmade crafts, and live entertainment. Over 30 curated brands under one roof.',
  totalBooths: 30,
  soldBooths: 24,
  rows: 8,
  cols: 10,
  zones: {
    food: { label: 'Food Zone 🍔', color: '#FF6B6B', priceEGP: 5000 },
    fashion: { label: 'Fashion Zone 👗', color: '#6C5CE7', priceEGP: 3500 },
    handmade: { label: 'Handmade Zone 🎨', color: '#00B894', priceEGP: 3000 },
    beauty: { label: 'Beauty Zone 💄', color: '#FDCB6E', priceEGP: 4000 },
  },
  // Social proof - who's already booked
  bookedVendors: [
    { name: 'Sweet Treats Bakery', insta: '@sweet.treats.eg', category: 'Food', booth: 'B03' },
    { name: 'Nora Jewelry', insta: '@nora.jewelry', category: 'Accessories', booth: 'B07' },
    { name: 'Baked By Sara', insta: '@bakedbysara', category: 'Food', booth: 'B11' },
    { name: 'The Candle Lab', insta: '@thecandlelab.eg', category: 'Handmade', booth: 'B15' },
    { name: 'Lina\'s Closet', insta: '@linascloset', category: 'Fashion', booth: 'B19' },
    { name: 'Glow Skincare', insta: '@glow.skincare.eg', category: 'Beauty', booth: 'B22' },
    { name: 'Cairo Pottery', insta: '@cairopottery', category: 'Handmade', booth: 'B25' },
    { name: 'Threads & Co', insta: '@threads.and.co', category: 'Fashion', booth: 'B28' },
  ],
};

export default function BazaarPage() {
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const bazaar = DEMO_BAZAAR;

  const occupancyPercent = Math.round((bazaar.soldBooths / bazaar.totalBooths) * 100);
  const boothsLeft = bazaar.totalBooths - bazaar.soldBooths;

  const handleBoothSelect = (booth) => {
    setSelectedBooth(booth);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedBooth(null), 300);
  };

  const handleConfirmBooking = (booth) => {
    // In production: create Paymob payment intention, redirect to checkout
    alert(`🎉 Redirecting to Paymob to pay for booth ${booth.id}...\n\nIn production, this would open the Paymob checkout (Card / InstaPay / Vodafone Cash).`);
  };

  return (
    <>
      <Head>
        <title>{bazaar.name} — Book Your Booth | BAZAAR-OS</title>
        <meta name="description" content={bazaar.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Open Graph for WhatsApp/Instagram link previews */}
        <meta property="og:title" content={`${bazaar.name} — Book Your Booth`} />
        <meta property="og:description" content={`${boothsLeft} booths left! ${bazaar.date} at ${bazaar.location}`} />
        <meta property="og:type" content="website" />
      </Head>

      {/* Minimal Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          🏪 <span>BAZAAR</span>-OS
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Powered by BAZAAR-OS
        </div>
      </nav>

      <main className="page">
        <div className="container">

          {/* Bazaar Header */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h1 style={{ marginBottom: 'var(--space-sm)' }}>{bazaar.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--space-md)' }}>
              {bazaar.description}
            </p>

            {/* Event Details */}
            <div style={{ 
              display: 'flex', flexWrap: 'wrap', gap: '12px', 
              marginBottom: 'var(--space-lg)' 
            }}>
              <div className="badge" style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', padding: '8px 14px', fontSize: '0.82rem',
              }}>
                📅 {bazaar.date}
              </div>
              <div className="badge" style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', padding: '8px 14px', fontSize: '0.82rem',
              }}>
                🕐 {bazaar.time}
              </div>
              <div className="badge" style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', padding: '8px 14px', fontSize: '0.82rem',
              }}>
                📍 {bazaar.location}
              </div>
              <div className="badge" style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', padding: '8px 14px', fontSize: '0.82rem',
              }}>
                🎤 By {bazaar.organizer}
              </div>
            </div>

            {/* FOMO Counter */}
            <div className="glass-card" style={{ 
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 20px',
            }}>
              {/* Progress Bar */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', 
                  marginBottom: '8px', fontSize: '0.85rem' 
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--color-accent)' }}>{bazaar.soldBooths}</strong>/{bazaar.totalBooths} booths sold
                  </span>
                  <span style={{ 
                    color: boothsLeft <= 5 ? 'var(--color-accent)' : 'var(--color-success)',
                    fontWeight: 700,
                    animation: boothsLeft <= 5 ? 'pulse-glow 1.5s infinite' : 'none',
                  }}>
                    {boothsLeft <= 5 ? `🔥 Only ${boothsLeft} left!` : `${boothsLeft} available`}
                  </span>
                </div>
                <div style={{ 
                  width: '100%', height: '8px', borderRadius: '4px',
                  background: 'var(--bg-elevated)', overflow: 'hidden',
                }}>
                  <div style={{ 
                    width: `${occupancyPercent}%`, height: '100%', borderRadius: '4px',
                    background: occupancyPercent > 80 
                      ? 'linear-gradient(90deg, var(--color-warning), var(--color-accent))' 
                      : 'linear-gradient(90deg, var(--color-success), var(--color-success-light))',
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* The Interactive Booth Map */}
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-md)' }}>📍 Select Your Booth</h2>
            <BoothMap 
              onBoothSelect={handleBoothSelect} 
              selectedBooth={selectedBooth}
            />
          </div>

          {/* Social Proof Wall: Who's Already Booked */}
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-md)' }}>
              ✅ Who's Already Booked
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
              {bazaar.bookedVendors.length} brands confirmed and counting.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
              gap: '12px' 
            }}>
              {bazaar.bookedVendors.map((vendor, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  transition: 'all var(--transition-fast)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  }}>
                    {vendor.booth}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 600, fontSize: '0.85rem', 
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                    }}>
                      {vendor.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', color: 'var(--color-primary-light)' 
                    }}>
                      {vendor.insta}
                    </div>
                  </div>
                  <span className="badge badge-sold" style={{ fontSize: '0.65rem' }}>
                    {vendor.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA at the bottom */}
          <div style={{ 
            textAlign: 'center', padding: 'var(--space-2xl)',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
          }}>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>Want to be part of this bazaar?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Select your booth on the map above and secure your spot today.
            </p>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn btn-primary btn-lg">
              ⬆ Scroll Up to Book Your Booth
            </a>
          </div>

        </div>
      </main>

      {/* Booking Panel */}
      <BookingPanel
        booth={selectedBooth}
        bazaarZones={bazaar.zones}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onConfirm={handleConfirmBooking}
      />

      {/* Footer */}
      <footer style={{ 
        padding: 'var(--space-lg)', textAlign: 'center', 
        borderTop: '1px solid var(--border-color)', 
        color: 'var(--text-muted)', fontSize: '0.8rem' 
      }}>
        <p>Powered by <strong style={{ color: 'var(--text-secondary)' }}>BAZAAR-OS</strong> · <a href="/">Create your own bazaar — Free</a></p>
      </footer>
    </>
  );
}
