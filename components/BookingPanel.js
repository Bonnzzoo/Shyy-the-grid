import { useState } from 'react';

export default function BookingPanel({ booth, bazaarZones, isOpen, onClose, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  if (!booth) return null;

  const isSold = booth.status === 'sold';
  const zone = bazaarZones[booth.zone] || { label: 'Standard Zone' };
  const price = zone?.priceEGP || 0;
  const platformFee = Math.round(price * 0.1);
  const total = price + platformFee;

  return (
    <>
      <div className={`booking-panel-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <div className={`booking-panel ${isOpen ? 'open' : ''}`}>
        <button className="booking-panel-close" onClick={onClose}>✕</button>
        
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: isSold ? 'var(--color-warning)' : 'var(--text-muted)' }}>
            {isSold ? 'Waitlist for Booth' : 'Selected Booth'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {booth.id}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {zone?.label}
          </div>
          {isSold && (
            <div style={{ padding: '12px 16px', background: '#FFF3E0', borderRadius: '8px', color: '#E65100', fontSize: '0.8rem', marginTop: '16px', fontWeight: 500 }}>
              This booth is currently sold. Join the waitlist and we will notify you immediately if the vendor cancels or if a similar booth opens up!
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 'var(--space-xl)' }}>
          <div className="input-group">
            <label>Business Name</label>
            <input className="input" placeholder="e.g., Sweet Treats Bakery" />
          </div>
          <div className="input-group">
            <label>WhatsApp Number</label>
            <input className="input" placeholder="01x xxxx xxxx" />
          </div>
          <div className="input-group">
            <label>Instagram Handle</label>
            <input className="input" placeholder="@yourbrand" />
          </div>
        </div>

        {!isSold && (
          <>
            <div className="booking-total">
              <div className="booking-total-row">
                <span className="booking-total-label">Booth Price</span>
                <span style={{ color: 'var(--text-secondary)' }}>{price.toLocaleString()} EGP</span>
              </div>
              <div className="booking-total-row">
                <span className="booking-total-label">Platform Fee</span>
                <span style={{ color: 'var(--text-secondary)' }}>{platformFee.toLocaleString()} EGP</span>
              </div>
              <div className="booking-total-row" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <span className="booking-total-label" style={{ color: 'var(--text-primary)' }}>Total Due</span>
                <span className="booking-total-price">{total.toLocaleString()} <span style={{ fontSize: '1rem' }}>EGP</span></span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'block' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: paymentMethod === 'card' ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', background: paymentMethod === 'card' ? 'var(--bg-secondary)' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  💳 Card
                </button>
                <button 
                  onClick={() => setPaymentMethod('instapay')}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: paymentMethod === 'instapay' ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', background: paymentMethod === 'instapay' ? '#F3E5F5' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: paymentMethod === 'instapay' ? '#6A1B9A' : 'var(--text-primary)' }}
                >
                  ⚡️ InstaPay
                </button>
                <button 
                  onClick={() => setPaymentMethod('wallet')}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: paymentMethod === 'wallet' ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', background: paymentMethod === 'wallet' ? '#FFEBEE' : 'var(--bg-card)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: paymentMethod === 'wallet' ? '#D32F2F' : 'var(--text-primary)' }}
                >
                  📱 V-Cash
                </button>
              </div>
              
              {paymentMethod === 'instapay' && (
                <div style={{ padding: '12px', background: '#F9F9F9', borderRadius: '8px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Transfer <strong>{total.toLocaleString()} EGP</strong> to InstaPay address: <strong>bazaar-os@instapay</strong>. Then click complete below.
                </div>
              )}
              {paymentMethod === 'wallet' && (
                <div style={{ padding: '12px', background: '#F9F9F9', borderRadius: '8px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Transfer <strong>{total.toLocaleString()} EGP</strong> via Vodafone Cash to <strong>0100 123 4567</strong>. Then click complete below.
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => onConfirm && onConfirm(booth)}>
            {isSold ? 'Join Waitlist' : 'Complete Booking'}
          </button>
        </div>
      </div>
    </>
  );
}
