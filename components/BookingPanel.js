import { useState, useEffect } from 'react';
import { getCurrentPhase, PHASES } from '../utils/bookingEngine';
import { addToWaitlist } from '../utils/waitlistService';
import { createBooking } from '../utils/bookingService';

export default function BookingPanel({ booth, bazaarZones, isOpen, onClose, onConfirm, bazaarPhase, eventId = 'lydia-demo', brandAccent }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [category, setCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [taxCardFile, setTaxCardFile] = useState(null);
  const [taxCardPreview, setTaxCardPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formStep, setFormStep] = useState(1);
  
  // New Fields
  const [ownerName, setOwnerName] = useState('');
  const [isEgyptianBrand, setIsEgyptianBrand] = useState('');
  const [joinedBefore, setJoinedBefore] = useState('');
  const [datesToJoin, setDatesToJoin] = useState([]);
  const [brandBrief, setBrandBrief] = useState('');

  // Determine mode based on phase (admin-controlled or prop)
  const currentPhase = bazaarPhase === 'priority' ? PHASES.PRIORITY_BOOKING : bazaarPhase === 'waitlist' ? PHASES.WAITLIST_OPEN : getCurrentPhase();
  const isPriority = currentPhase === PHASES.PRIORITY_BOOKING;
  const isPaymentMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('pay');
  const isSold = booth?.status === 'sold' && !isPaymentMode;
  const isApplicationMode = !isPriority && !isPaymentMode;

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setBusinessName('');
      setCategory('');
      setContactEmail('');
      setWhatsapp('');
      setInstagram('');
      setTaxCardFile(null);
      setTaxCardPreview(null);
      setLogoFile(null);
      setLogoPreview(null);
      setOwnerName('');
      setIsEgyptianBrand('');
      setJoinedBefore('');
      setDatesToJoin([]);
      setBrandBrief('');
      setFormStep(isPaymentMode ? 3 : 1);
    }
  }, [isOpen, booth, isPaymentMode]);

  if (!booth) return null;

  const zone = bazaarZones?.[booth.zone] || { label: 'Standard Zone' };
  const price = zone?.priceEGP || 0;
  const platformFee = Math.round(price * 0.1);
  const total = price + platformFee;
  
  const isPremiumLogoRequired = booth.zone === 'fashion_icon' || booth.zone === 'beauty_icon';

  const handleTaxCardUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTaxCardFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setTaxCardPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setTaxCardPreview('pdf');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setTaxCardFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setTaxCardPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setTaxCardPreview('pdf');
    }
  };

  const totalSteps = isApplicationMode ? 2 : 3;

  return (
    <>
      <div className={`booking-panel-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <div className={`booking-panel ${isOpen ? 'open' : ''}`}>
        <button className="booking-panel-close" onClick={onClose}>✕</button>

        {isSuccess ? (
          /* ═══ Success Screen ═══ */
          <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '16px' }}>
            {/* Minimal checkmark */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: 'checkmarkDraw 0.6s ease 0.2s both' }} />
              </svg>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '8px', fontSize: '1.5rem', fontWeight: 400 }}>
              {isApplicationMode ? 'Application Submitted' : 'Booth Secured'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 32px' }}>
              {isApplicationMode ? (
                <>Your brand <strong>{businessName || 'Your Brand'}</strong> has been submitted for review. We'll notify you via WhatsApp within 24 hours.</>
              ) : (
                <>Booth <strong>{booth.id}</strong> has been secured for <strong>{businessName || 'Your Brand'}</strong>.</>
              )}
            </p>

            {!isApplicationMode && (
              <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', display: 'inline-block', marginBottom: '32px' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '14px' }}>Access Pass</div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=Booth:${booth.id}|Brand:${encodeURIComponent(businessName || 'Brand')}|Time:${Date.now()}`}
                  alt="QR Code"
                  style={{ width: '160px', height: '160px', borderRadius: '8px', marginBottom: '14px', background: '#fff', padding: '8px' }}
                />
                <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>Booth {booth.id}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{businessName || 'Your Brand'}</div>
              </div>
            )}

            {isApplicationMode && (
              <div style={{ background: 'var(--color-success-light)', padding: '20px 24px', borderRadius: '12px', marginBottom: '32px', maxWidth: '380px', margin: '0 auto 32px' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-success)', fontWeight: 600, marginBottom: '8px' }}>What happens next</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  We'll review your tax card and brand details. If approved, you'll receive a payment link on WhatsApp.
                </div>
              </div>
            )}

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px' }}>
              {isApplicationMode
                ? 'Ensure your WhatsApp number is correct — we\'ll contact you there.'
                : 'Save this QR code for check-in during preparation and bazaar days.'
              }
            </p>

            <button className="btn btn-primary btn-lg btn-block" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* ═══ Header ═══ */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              {/* Step indicator */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '28px' }}>
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 2, borderRadius: 1,
                    background: i + 1 <= formStep ? 'var(--text-primary)' : 'var(--border-color)',
                    transition: 'background 0.3s ease',
                  }} />
                ))}
              </div>

              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {isApplicationMode ? 'Apply for Booth' : isSold ? 'Application for Booth' : 'Reserve Booth'}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {booth.id}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span>{zone?.label}</span>
                {zone?.dimensions && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    · {zone.dimensions}
                  </span>
                )}
              </div>

              {isApplicationMode && (
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '16px', lineHeight: 1.6 }}>
                  Submit your brand details and tax card for review. If approved, you'll receive a payment link via WhatsApp.
                </div>
              )}
            </div>

            {/* ═══ Step 1: Brand Info ═══ */}
            {formStep === 1 && (
              <div className="animate-in">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'var(--space-lg)' }}>
                  <div className="input-group">
                    <label>Your Name *</label>
                    <input
                      className="input"
                      placeholder="e.g., John Doe"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Business / Brand Name *</label>
                    <input
                      className="input"
                      placeholder="e.g., Sweet Treats Bakery"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Brand Category</label>
                    <select
                      className="input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="" disabled>Select Category</option>
                      <option value="Fashion Icons">Fashion Icons</option>
                      <option value="Beauty Icons">Beauty Icons</option>
                      <option value="Home Essentials">Home Essentials</option>
                      <option value="Natural Blends">Natural Blends</option>
                      <option value="Accessories">Accessories</option>
                      <option value="other">Other (Please Specify)</option>
                    </select>
                  </div>
                  {category === 'other' && (
                    <div className="input-group" style={{ marginTop: '-8px' }}>
                      <input
                        className="input"
                        placeholder="Type your category..."
                        value={otherCategory}
                        onChange={(e) => setOtherCategory(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="input-group">
                    <label>WhatsApp Number</label>
                    <input className="input" placeholder="01x xxxx xxxx" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Instagram Handle</label>
                    <input className="input" placeholder="@yourbrand" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Contact Email</label>
                    <input className="input" type="email" placeholder="you@email.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  {isApplicationMode && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div className="input-group">
                        <label>Is your brand an Egyptian Local Brand? *</label>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400, fontSize: '0.88rem' }}>
                            <input type="radio" name="egyptian" checked={isEgyptianBrand === 'Yes'} onChange={() => setIsEgyptianBrand('Yes')} /> Yes
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400, fontSize: '0.88rem' }}>
                            <input type="radio" name="egyptian" checked={isEgyptianBrand === 'No'} onChange={() => setIsEgyptianBrand('No')} /> No
                          </label>
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Did you join LA Market before? *</label>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400, fontSize: '0.88rem' }}>
                            <input type="radio" name="joined" checked={joinedBefore === 'Yes'} onChange={() => setJoinedBefore('Yes')} /> Yes
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400, fontSize: '0.88rem' }}>
                            <input type="radio" name="joined" checked={joinedBefore === 'No'} onChange={() => setJoinedBefore('No')} /> No
                          </label>
                        </div>
                      </div>

                      <div className="input-group">
                        <label style={{ lineHeight: 1.4 }}>Please Choose the dates of the events you're planning to join on 2026: *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                          {[
                            "13 & 14 February Ramadan & Winter Sale",
                            "13 & 14 March - Eid & Mother’s Day",
                            "15 & 16 May - Summer Breeze Eid Edition",
                            "3 & 4 July - Summer Breeze Second Edition",
                            "2 & 3 October - Summer Sale",
                            "20 & 21 November - Winter First Edition",
                            "25 & 26 December - Winter Second Edition"
                          ].map(date => (
                            <label key={date} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              <input 
                                type="checkbox" 
                                checked={datesToJoin.includes(date)}
                                onChange={(e) => {
                                  if (e.target.checked) setDatesToJoin([...datesToJoin, date]);
                                  else setDatesToJoin(datesToJoin.filter(d => d !== date));
                                }}
                              />
                              {date}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="input-group">
                        <label style={{ lineHeight: 1.4 }}>Write a brief about your brand and why we should accept you to join our Exhibition: *</label>
                        <textarea
                          className="input"
                          placeholder="Your answer"
                          value={brandBrief}
                          onChange={(e) => setBrandBrief(e.target.value)}
                          style={{ minHeight: '80px', resize: 'vertical', marginTop: '6px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-lg btn-block"
                  onClick={() => setFormStep(2)}
                  disabled={!businessName || !category || !ownerName || (isApplicationMode && (!isEgyptianBrand || !joinedBefore || datesToJoin.length === 0 || !brandBrief))}
                >
                  Next: Upload Documents
                </button>
              </div>
            )}

            {/* ═══ Step 2: Tax Card & Logo Upload ═══ */}
            {formStep === 2 && (
              <div className="animate-in">
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  {isPremiumLogoRequired && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Logo (400×400px)</label>
                      <div
                        className={`upload-zone ${logoFile ? 'has-file' : ''}`}
                        onClick={() => document.getElementById('logo-input')?.click()}
                      >
                        {logoFile ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            {logoPreview && (
                              <img src={logoPreview} alt="Logo Preview" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
                            )}
                            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-success)' }}>{logoFile.name}</div>
                          </div>
                        ) : (
                          <>
                            <div className="upload-zone-label">Upload High-Res Logo</div>
                            <div className="upload-zone-hint">Required for premium booth displays</div>
                          </>
                        )}
                        <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                      </div>
                    </div>
                  )}

                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tax Card / Registration</label>
                  <div
                    className={`upload-zone ${taxCardFile ? 'has-file' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('tax-card-input')?.click()}
                  >
                    {taxCardFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {taxCardPreview && taxCardPreview !== 'pdf' ? (
                          <img src={taxCardPreview} alt="Tax Card Preview" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                        ) : (
                          <div style={{ fontSize: '1.5rem', opacity: 0.4 }}>PDF</div>
                        )}
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-success)' }}>{taxCardFile.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(taxCardFile.size / 1024).toFixed(0)} KB — Click to replace</div>
                      </div>
                    ) : (
                      <>
                        <div className="upload-zone-label">Upload Tax Card</div>
                        <div className="upload-zone-hint">
                          Drag & drop or click to upload<br />
                          PDF, JPG, or PNG — Max 5MB
                        </div>
                      </>
                    )}
                    <input
                      id="tax-card-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={handleTaxCardUpload}
                    />
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
                    Your tax registration card is required for official brand documentation. This will be kept confidential.
                  </p>
                </div>

                {!taxCardFile && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '6px', fontWeight: 500 }}>
                    Tax card upload is required for all brands
                  </p>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-outline btn-block" onClick={() => setFormStep(1)}>Back</button>
                  {isApplicationMode ? (
                    <button 
                      className="btn btn-primary btn-lg btn-block" 
                      onClick={async () => {
                        await addToWaitlist(eventId, {
                          brand: businessName,
                          category: category === 'other' ? otherCategory : category,
                          phone: whatsapp,
                          instagram,
                          email: contactEmail,
                          ownerName,
                          isEgyptianBrand,
                          joinedBefore,
                          datesToJoin,
                          requestMessage: brandBrief,
                          taxCardUploaded: !!taxCardFile,
                          preferredZone: booth?.zone || 'Unspecified'
                        });
                        setIsSuccess(true);
                      }} 
                      disabled={!taxCardFile || (isPremiumLogoRequired && !logoFile)}
                    >
                      Submit Application
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-block" onClick={() => setFormStep(3)} disabled={!taxCardFile || (isPremiumLogoRequired && !logoFile)}>
                      Next: Payment
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ═══ Step 3: Payment (Only for direct booking / priority) ═══ */}
            {formStep === 3 && !isApplicationMode && (
              <div className="animate-in">
                <div className="booking-total" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <div className="booking-total-row">
                    <span className="booking-total-label">Booth Price</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{price.toLocaleString()} EGP</span>
                  </div>
                  <div className="booking-total-row">
                    <span className="booking-total-label">Platform Fee</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{platformFee.toLocaleString()} EGP</span>
                  </div>
                  <div className="booking-total-row" style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                    <span className="booking-total-label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Due</span>
                    <span className="booking-total-price">{total.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>EGP</span></span>
                  </div>
                </div>

                <div style={{ margin: 'var(--space-lg) 0' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'block' }}>Payment Method</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { key: 'card', label: 'Card' },
                      { key: 'instapay', label: 'InstaPay' },
                      { key: 'wallet', label: 'V-Cash' },
                    ].map(m => (
                      <button
                        key={m.key}
                        onClick={() => setPaymentMethod(m.key)}
                        style={{
                          flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)',
                          border: paymentMethod === m.key ? '1.5px solid var(--text-primary)' : '1px solid var(--border-color)',
                          background: paymentMethod === m.key ? 'var(--bg-secondary)' : 'transparent',
                          cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
                          fontFamily: 'var(--font-primary)', color: 'var(--text-primary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'instapay' && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Transfer <strong>{total.toLocaleString()} EGP</strong> to InstaPay: <strong>bazaar-os@instapay</strong>
                    </div>
                  )}
                  {paymentMethod === 'wallet' && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Transfer <strong>{total.toLocaleString()} EGP</strong> via Vodafone Cash to <strong>0100 123 4567</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {!isPaymentMode && <button className="btn btn-outline btn-block" onClick={() => setFormStep(2)}>Back</button>}
                  <button className="btn btn-primary btn-lg btn-block" onClick={async () => {
                    await createBooking(eventId, {
                      boothId: booth?.id || booth?.boothId || 'A1',
                      brand: businessName || 'Your Brand',
                      brandType: 'returning',
                      category: category === 'other' ? otherCategory : category || 'Fashion Icons',
                      phone: whatsapp || 'N/A',
                      instagram: instagram || 'N/A',
                      email: contactEmail || 'N/A',
                      amount: total || 25000,
                      status: 'Paid',
                      taxCardUploaded: !!taxCardFile,
                      date: 'Just now',
                      paidAt: new Date().toISOString(),
                      scanLog: [],
                    });
                    setIsSuccess(true);
                    if (onConfirm) onConfirm(booth);
                  }}>
                    Complete Booking
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
