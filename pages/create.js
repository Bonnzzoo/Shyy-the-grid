import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const TEMPLATES = [
  { id: 'rows', name: 'Classic Rows', icon: '▤', desc: 'Standard bazaar rows with a central walkway', defaultRows: 6, defaultCols: 8 },
  { id: 'ushape', name: 'U-Shape', icon: '⊔', desc: 'Booths around edges, open center stage area', defaultRows: 6, defaultCols: 8 },
  { id: 'lshape', name: 'L-Shape', icon: '⌐', desc: 'Corner venue layout with two wings', defaultRows: 6, defaultCols: 8 },
  { id: 'grid', name: 'Open Grid', icon: '⊞', desc: 'Full grid, no walkways — maximum booths', defaultRows: 5, defaultCols: 6 },
  { id: 'custom', name: 'Custom', icon: '✏️', desc: 'You tell us rows & columns', defaultRows: 4, defaultCols: 6 },
];

const ZONE_PRESETS = [
  { key: 'food', label: 'Food & Beverages 🍔', color: '#FF6B6B', defaultPrice: 5000 },
  { key: 'fashion', label: 'Fashion & Clothing 👗', color: '#6C5CE7', defaultPrice: 3500 },
  { key: 'handmade', label: 'Handmade & Crafts 🎨', color: '#00B894', defaultPrice: 3000 },
  { key: 'beauty', label: 'Beauty & Skincare 💄', color: '#FDCB6E', defaultPrice: 4000 },
  { key: 'accessories', label: 'Accessories & Jewelry 💎', color: '#E17055', defaultPrice: 3500 },
  { key: 'home', label: 'Home & Decor 🏠', color: '#74B9FF', defaultPrice: 3000 },
];

export default function CreateBazaar() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    template: null,
    totalBooths: 30,
    zones: [
      { key: 'food', label: 'Food Zone 🍔', color: '#FF6B6B', price: 5000, enabled: true },
      { key: 'fashion', label: 'Fashion Zone 👗', color: '#6C5CE7', price: 3500, enabled: true },
      { key: 'handmade', label: 'Handmade Zone 🎨', color: '#00B894', price: 3000, enabled: true },
    ],
  });

  const [generatedLink, setGeneratedLink] = useState(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectTemplate = (template) => {
    updateField('template', template);
  };

  const handlePublish = () => {
    // In production: POST to Supabase, generate slug
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    setGeneratedLink(`bazaaros.com/b/${slug}`);
    setStep(4);
  };

  return (
    <>
      <Head>
        <title>Create Your Bazaar — BAZAAR-OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          🏪 <span>BAZAAR</span>-OS
        </Link>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Step {step} of 3
        </div>
      </nav>

      <main className="page">
        <div className="container" style={{ maxWidth: 700 }}>

          {/* Progress Bar */}
          <div style={{ 
            display: 'flex', gap: '8px', marginBottom: 'var(--space-2xl)',
            padding: '0 var(--space-md)',
          }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? 'var(--color-primary)' : 'var(--bg-elevated)',
                transition: 'background 0.3s ease',
              }} />
            ))}
          </div>

          {/* ===================== STEP 1: Basic Details ===================== */}
          {step === 1 && (
            <div className="animate-in">
              <h1 style={{ marginBottom: 'var(--space-xs)' }}>Tell us about your bazaar</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                Fill in the basics. You can always edit this later.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Bazaar Name *</label>
                  <input 
                    className="input" 
                    placeholder="e.g., Ramadan Night Bazaar" 
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="input-group">
                    <label>Date *</label>
                    <input 
                      className="input" type="date" 
                      value={formData.date}
                      onChange={e => updateField('date', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Time</label>
                    <input 
                      className="input" 
                      placeholder="e.g., 5 PM — 11 PM" 
                      value={formData.time}
                      onChange={e => updateField('time', e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Location *</label>
                  <input 
                    className="input" 
                    placeholder="e.g., The Waterway, New Cairo" 
                    value={formData.location}
                    onChange={e => updateField('location', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea 
                    className="input" 
                    rows={3}
                    placeholder="Tell vendors what your bazaar is about..."
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.location}
                >
                  Next: Choose Layout →
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 2: Layout Template ===================== */}
          {step === 2 && (
            <div className="animate-in">
              <h1 style={{ marginBottom: 'var(--space-xs)' }}>Choose your layout</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                Pick a template that matches your venue. Don't overthink it — you can adjust later.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: 'var(--space-xl)' }}>
                {TEMPLATES.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    style={{
                      padding: '20px', borderRadius: 'var(--radius-lg)',
                      background: formData.template?.id === t.id ? 'rgba(108, 92, 231, 0.15)' : 'var(--bg-card)',
                      border: `2px solid ${formData.template?.id === t.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{t.icon}</div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                ))}
              </div>

              {/* Booth Count */}
              <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="input-group">
                  <label>How many booths? (You can adjust on the map later)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input 
                      className="input" type="range" min="6" max="100" 
                      value={formData.totalBooths}
                      onChange={e => updateField('totalBooths', parseInt(e.target.value))}
                      style={{ flex: 1, padding: '4px' }}
                    />
                    <span style={{ 
                      fontFamily: 'var(--font-display)', fontSize: '1.5rem', 
                      fontWeight: 800, color: 'var(--color-primary-light)', minWidth: '50px',
                      textAlign: 'center',
                    }}>
                      {formData.totalBooths}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Photo Upload (Optional) */}
              <div className="glass-card" style={{ 
                borderStyle: 'dashed', textAlign: 'center', 
                padding: 'var(--space-xl)', cursor: 'pointer',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Optional: Upload a venue photo</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Our AI will analyze the space and suggest an optimized layout
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} id="venue-photo" />
                <label htmlFor="venue-photo" className="btn btn-outline btn-sm" style={{ marginTop: '12px', cursor: 'pointer' }}>
                  Upload Photo
                </label>
              </div>

              <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={() => setStep(3)}
                  disabled={!formData.template}
                >
                  Next: Set Prices →
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 3: Zones & Pricing ===================== */}
          {step === 3 && (
            <div className="animate-in">
              <h1 style={{ marginBottom: 'var(--space-xs)' }}>Set your zones & prices</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                Group your booths into zones. Each zone has its own price.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-xl)' }}>
                {formData.zones.map((zone, i) => (
                  <div key={zone.key} className="glass-card" style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px',
                  }}>
                    <div style={{
                      width: 12, height: 40, borderRadius: 6, 
                      background: zone.color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{zone.label}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        className="input" 
                        type="number" 
                        value={zone.price}
                        onChange={e => {
                          const newZones = [...formData.zones];
                          newZones[i].price = parseInt(e.target.value) || 0;
                          updateField('zones', newZones);
                        }}
                        style={{ width: '120px', textAlign: 'right' }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>EGP</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Zone */}
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Add more zones:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ZONE_PRESETS.filter(z => !formData.zones.find(fz => fz.key === z.key)).map(z => (
                    <button 
                      key={z.key} 
                      className="btn btn-outline btn-sm"
                      onClick={() => updateField('zones', [...formData.zones, { ...z, price: z.defaultPrice, enabled: true }])}
                    >
                      + {z.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Revenue Preview */}
              <div className="stat-card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="stat-label">Estimated Revenue (if sold out)</div>
                <div className="stat-value">
                  {(formData.totalBooths * (formData.zones.reduce((sum, z) => sum + z.price, 0) / formData.zones.length)).toLocaleString()} EGP
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Based on {formData.totalBooths} booths × average price of {Math.round(formData.zones.reduce((sum, z) => sum + z.price, 0) / formData.zones.length).toLocaleString()} EGP
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-outline" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button className="btn btn-success btn-lg" onClick={handlePublish}>
                  🚀 Publish My Bazaar
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 4: Success! ===================== */}
          {step === 4 && (
            <div className="animate-in" style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎉</div>
              <h1 style={{ marginBottom: 'var(--space-sm)' }}>Your Bazaar is Live!</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: 400, margin: '0 auto var(--space-xl)' }}>
                Share this link on your Instagram bio and WhatsApp status. 
                Vendors can start booking their booths right now.
              </p>

              {/* The Link */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                padding: '16px 24px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)', border: '2px solid var(--color-primary)',
                marginBottom: 'var(--space-xl)', cursor: 'pointer',
              }}
              onClick={() => {
                navigator.clipboard?.writeText(`https://${generatedLink}`);
                alert('Link copied!');
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                  🔗 {generatedLink}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📋 Copy</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 400, margin: '0 auto' }}>
                <Link href={`/b/demo`} className="btn btn-primary btn-lg btn-block">
                  👀 Preview Your Bazaar Page
                </Link>
                <button className="btn btn-outline btn-block" style={{ fontSize: '0.9rem' }}>
                  📱 Share on WhatsApp
                </button>
                <button className="btn btn-outline btn-block" style={{ fontSize: '0.9rem' }}>
                  📸 Share on Instagram
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
