import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { authenticate, hasPermission, getSidebarItems, getOrganizers, addOrganizer, removeOrganizer, ROLES, getRoleLabel, AVATAR_OPTIONS } from '../utils/auth';
import { PHASES, generateApprovalMessage, generateRejectionMessage, generateWhatsAppUrl, exportToCSV, exportWaitlistCSV } from '../utils/bookingEngine';
import { getEventById, updateEvent, updateEventPhase, subscribeToEvent } from '../utils/eventService';
import { getBookings, createBooking, updateBooking, logQRScan, calculateStats, subscribeToBookings } from '../utils/bookingService';
import { getWaitlist, approveRequest as approveWaitlistRequest, rejectRequest as rejectWaitlistRequest, subscribeToWaitlist } from '../utils/waitlistService';
import AiCopilot from '../components/AiCopilot';
import EventSelector from '../components/EventSelector';


export default function AdminDashboard() {
  // ── Auth State ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // ── Event Selection ──
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ── Dashboard State ──
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [currentPhase, setPhaseState] = useState(PHASES.PRIORITY_BOOKING);

  // ── Modals ──
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [logModal, setLogModal] = useState(null);
  const [reserveModal, setReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({ boothId: '', brand: '', category: 'Fashion Icons', phone: '', reason: 'VIP Sponsor' });
  const [reviewModal, setReviewModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [addOrgModal, setAddOrgModal] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({ name: '', email: '', password: '', role: ROLES.ORGANIZER, avatar: '🎯', title: '' });
  const [phaseConfirmModal, setPhaseConfirmModal] = useState(null);

  // ── QR Scanner State ──
  const [scanBoothId, setScanBoothId] = useState('');
  const [scanGate, setScanGate] = useState('Gate A');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  // ── Mobile ──
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationTimeout = useRef(null);

  // ── Load event data when an event is selected ──
  useEffect(() => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.id;
    setPhaseState(selectedEvent.currentPhase || PHASES.PRIORITY_BOOKING);

    // Load bookings and waitlist from services
    async function loadData() {
      const [bk, wl] = await Promise.all([
        getBookings(eventId),
        getWaitlist(eventId),
      ]);
      setBookings(bk);
      setWaitlist(wl);
    }
    loadData();

    // Subscribe to real-time updates
    const unsubBookings = subscribeToBookings(eventId, (bk) => setBookings(bk));
    const unsubWaitlist = subscribeToWaitlist(eventId, (wl) => setWaitlist(wl));
    const unsubEvent = subscribeToEvent(eventId, (ev) => {
      setPhaseState(ev.currentPhase || PHASES.PRIORITY_BOOKING);
      setSelectedEvent(prev => ({ ...prev, ...ev }));
    });

    return () => {
      if (typeof unsubBookings === 'function') unsubBookings();
      if (typeof unsubWaitlist === 'function') unsubWaitlist();
      if (typeof unsubEvent === 'function') unsubEvent();
    };
  }, [selectedEvent?.id]);

  const showNotification = (msg) => {
    setNotification(msg);
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    notificationTimeout.current = setTimeout(() => setNotification(null), 4000);
  };

  // ── Login Handler ──
  const handleLogin = (e) => {
    e.preventDefault();
    const result = authenticate(loginEmail, loginPassword);
    if (result.success) {
      setUser(result.user);
      setIsLoggedIn(true);
      setLoginError('');
      // Set default tab based on role
      const tabs = getSidebarItems(result.user);
      if (tabs.length > 0) setActiveTab(tabs[0].id);
    } else {
      setLoginError(result.error);
    }
  };

  // ── Phase Toggle ──
  const handlePhaseChange = (newPhase) => {
    if (newPhase === currentPhase) return;
    setPhaseConfirmModal(newPhase);
  };

  const confirmPhaseChange = async () => {
    if (!phaseConfirmModal || !selectedEvent) return;
    await updateEventPhase(selectedEvent.id, phaseConfirmModal);
    setPhaseState(phaseConfirmModal);
    setPhaseConfirmModal(null);
    const labels = { [PHASES.PRIORITY_BOOKING]: 'Priority Booking', [PHASES.WAITLIST_OPEN]: 'Open Applications', [PHASES.SOLD_OUT]: 'Sold Out' };
    showNotification(`✅ Phase changed to ${labels[phaseConfirmModal]}`);
  };

  // ── Booking Operations ──
  const saveEdit = async () => {
    if (!selectedEvent) return;
    await updateBooking(selectedEvent.id, editModal.id || editModal.boothId, editForm);
    setEditModal(null);
    showNotification('✅ Brand updated successfully');
  };

  const handleManualReserve = async () => {
    if (!selectedEvent) return;
    const newBooking = {
      boothId: reserveForm.boothId.toUpperCase(),
      brand: reserveForm.brand,
      brandType: 'returning',
      category: reserveForm.category,
      phone: reserveForm.phone || 'N/A',
      instagram: 'N/A',
      email: 'N/A',
      amount: 0,
      status: 'Paid',
      taxCardUploaded: true,
      date: 'Just now',
      paidAt: new Date().toISOString(),
      scanLog: [],
    };
    await createBooking(selectedEvent.id, newBooking);
    setReserveModal(false);
    setReserveForm({ boothId: '', brand: '', category: 'Fashion Icons', phone: '', reason: 'VIP Sponsor' });
    showNotification(`✅ Booth ${newBooking.boothId} reserved for ${newBooking.brand}`);
  };

  // ── Waitlist Request Review ──
  const handleApproveRequest = async (request) => {
    if (!selectedEvent) return;
    const eventSlug = selectedEvent.slug || selectedEvent.id;
    const paymentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/b/${eventSlug}?pay=${request.id}`;
    const msg = generateApprovalMessage(request.brand, paymentUrl);
    const waUrl = generateWhatsAppUrl(request.phone, msg);

    await approveWaitlistRequest(selectedEvent.id, request.id, user?.name || 'Admin');
    setReviewModal(null);
    showNotification(`✅ ${request.brand} approved! Opening WhatsApp...`);

    // Open WhatsApp in new tab
    setTimeout(() => window.open(waUrl, '_blank'), 500);
  };

  const handleRejectRequest = async (request) => {
    if (!selectedEvent) return;
    if (!rejectionReason.trim()) {
      showNotification('⚠️ Please provide a rejection reason');
      return;
    }
    const msg = generateRejectionMessage(request.brand, rejectionReason);
    const waUrl = generateWhatsAppUrl(request.phone, msg);

    await rejectWaitlistRequest(selectedEvent.id, request.id, user?.name || 'Admin', rejectionReason);
    setReviewModal(null);
    setRejectionReason('');
    showNotification(`❌ ${request.brand} rejected. Opening WhatsApp...`);

    setTimeout(() => window.open(waUrl, '_blank'), 500);
  };

  // ── QR Scanner ──
  const handleQRScan = async () => {
    if (!scanBoothId.trim() || !selectedEvent) return;
    const id = scanBoothId.trim().toUpperCase();
    const booking = bookings.find(b => b.boothId === id);
    
    if (!booking) {
      setScanResult({ error: true, message: `No booking found for booth ${id}` });
      return;
    }

    const scanEvent = booking.status === 'Checked In' ? 'Check-out' : `Check-in — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    await logQRScan(selectedEvent.id, id, {
      event: scanEvent,
      gate: scanGate,
      scannedBy: user?.name || 'Unknown',
    });
    setScanResult({
      error: false,
      booking: { ...booking, status: scanEvent.includes('Check-in') ? 'Checked In' : booking.status },
      event: scanEvent,
    });
    setScanBoothId('');
    setIsScanning(false);
    showNotification(`📱 ${scanEvent} recorded for ${booking.brand}`);
  };

  // ── Organizer Management ──
  const handleAddOrganizer = () => {
    if (!newOrgForm.name || !newOrgForm.email || !newOrgForm.password) {
      showNotification('⚠️ Please fill in all required fields');
      return;
    }
    const result = addOrganizer(newOrgForm);
    if (result.success) {
      setAddOrgModal(false);
      setNewOrgForm({ name: '', email: '', password: '', role: ROLES.ORGANIZER, avatar: '🎯', title: '' });
      showNotification(`✅ ${result.organizer.name} added as ${getRoleLabel(result.organizer.role)}`);
    } else {
      showNotification(`⚠️ ${result.error}`);
    }
  };

  const handleRemoveOrganizer = (id) => {
    const result = removeOrganizer(id);
    if (result.success) {
      showNotification('✅ Organizer removed');
    } else {
      showNotification(`⚠️ ${result.error}`);
    }
  };

  // ── Computed Stats ──
  const stats = calculateStats(bookings, waitlist);
  const filteredBookings = bookings.filter(b => !searchQuery || b.brand.toLowerCase().includes(searchQuery.toLowerCase()) || b.boothId.toLowerCase().includes(searchQuery.toLowerCase()));
  const pendingReviewWaitlist = waitlist.filter(w => w.status === 'pending_review');
  const sidebarItems = user ? getSidebarItems(user) : [];

  // ═══════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <>
        <Head><title>Admin Login — BAZAAR-OS</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 'var(--space-lg)' }}>
          <div className="animate-in" style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-inverse)', fontSize: '1.2rem', fontWeight: 700 }}>✦</div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Admin Login</h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>BAZAAR-OS Management Console</p>
            </div>

            <form onSubmit={handleLogin} className="glass-card" style={{ padding: '32px' }}>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@thegrid.io" autoComplete="email" />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input className="input" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              {loginError && <p style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginBottom: '12px' }}>⚠ {loginError}</p>}
              <button className="btn btn-primary btn-block btn-lg" type="submit">Sign In</button>
            </form>

            <div style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong>Demo Credentials:</strong><br />
              Admin: admin@thegrid.io / admin123<br />
              Organizer: lydia@lamarket.com / lydia123
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════
  // EVENT SELECTOR (between login and dashboard)
  // ═══════════════════════════════════════════
  if (!selectedEvent) {
    return (
      <>
        <Head><title>Select Event — The Grid</title></Head>

        {/* Top bar with user info */}
        <div style={{
          padding: '12px var(--space-lg)', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)', fontWeight: 700, fontSize: '0.7rem' }}>✦</div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>The Grid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user?.name}</span>
            <button className="btn btn-sm btn-outline" onClick={() => { setIsLoggedIn(false); setUser(null); }}>
              Sign Out
            </button>
          </div>
        </div>

        <EventSelector
          user={user}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setActiveTab('overview');
          }}
        />
      </>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════
  return (
    <>
      <Head><title>Dashboard — BAZAAR-OS</title></Head>

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '12px 24px', borderRadius: 'var(--radius-full)',
          background: 'var(--text-primary)', color: 'var(--text-inverse)',
          fontSize: '0.82rem', fontWeight: 500, boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.3s ease', fontFamily: 'var(--font-primary)',
        }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* ═══ Desktop Sidebar ═══ */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            {selectedEvent.logoUrl ? (
              <img src={selectedEvent.logoUrl} alt={selectedEvent.organizer} style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--border-color)' }} onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: selectedEvent.brandAccent || 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>✦</div>
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', letterSpacing: '0.02em', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedEvent.name || 'The Grid'}</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{selectedEvent.edition || 'by SHYY'}</div>
            </div>
          </div>

          {/* Back to events */}
          <button
            onClick={() => setSelectedEvent(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 20px', fontSize: '0.72rem', color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)',
              marginBottom: '8px',
            }}
          >
            ← All Events
          </button>

          <nav className="sidebar-nav">
            {sidebarItems.map(item => (
              <button key={item.id} className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'waitlist' && pendingReviewWaitlist.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-full)', minWidth: '18px', textAlign: 'center' }}>
                    {pendingReviewWaitlist.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {hasPermission(user, 'canUseAI') && (
            <div style={{ padding: '0 12px', marginTop: '12px' }}>
              <button className="sidebar-nav-item" onClick={() => setIsAIOpen(true)} style={{ background: 'linear-gradient(135deg, rgba(138,102,66,0.06), rgba(201,168,124,0.08))', border: '1px solid rgba(138,102,66,0.12)' }}>
                <span>✦</span>
                <span>AI Assistant</span>
              </button>
            </div>
          )}

          <div className="sidebar-footer">
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>{user?.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getRoleLabel(user?.role)}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setIsLoggedIn(false); setUser(null); setLoginEmail(''); setLoginPassword(''); }} style={{ fontSize: '0.7rem' }}>↪</button>
          </div>
        </aside>

        {/* ═══ Mobile Header ═══ */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)', fontWeight: 700, fontSize: '0.7rem' }}>✦</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>The Grid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem' }}>{user?.avatar}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { setIsLoggedIn(false); setUser(null); }} style={{ fontSize: '0.65rem' }}>↪</button>
          </div>
        </div>

        {/* ═══ Main Content ═══ */}
        <main className="admin-main-content" style={{ flex: 1, padding: 'var(--space-xl)', overflowY: 'auto' }}>

          {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
          {activeTab === 'overview' && (
            <div className="animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Dashboard</h1>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Summer Breeze: 2nd Edition</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {hasPermission(user, 'canExportData') && (
                    <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(bookings)}>📥 Export CSV</button>
                  )}
                  {hasPermission(user, 'canManualReserve') && (
                    <button className="btn btn-primary btn-sm" onClick={() => setReserveModal(true)}>+ Manual Reserve</button>
                  )}
                </div>
              </div>

              {/* Phase Toggle Card */}
              {hasPermission(user, 'canChangePhase') && (
                <div className="phase-toggle-card">
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Current Phase</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {currentPhase === PHASES.PRIORITY_BOOKING ? '✦ Priority Booking' : currentPhase === PHASES.WAITLIST_OPEN ? '📋 Open Applications' : '🔒 Sold Out'}
                    </div>
                  </div>
                  <div className="phase-toggle-switch">
                    <button className={`phase-toggle-option ${currentPhase === PHASES.PRIORITY_BOOKING ? 'active' : ''}`} onClick={() => handlePhaseChange(PHASES.PRIORITY_BOOKING)}>Priority</button>
                    <button className={`phase-toggle-option ${currentPhase === PHASES.WAITLIST_OPEN ? 'active' : ''}`} onClick={() => handlePhaseChange(PHASES.WAITLIST_OPEN)}>Applications</button>
                    <button className={`phase-toggle-option ${currentPhase === PHASES.SOLD_OUT ? 'active' : ''}`} onClick={() => handlePhaseChange(PHASES.SOLD_OUT)}>Sold Out</button>
                  </div>
                </div>
              )}

              {/* Smart Notifications */}
              {(pendingReviewWaitlist.length > 0 || stats.pendingCount > 0) && (
                <div className="notification-bar">
                  {pendingReviewWaitlist.length > 0 && (
                    <button className="notification-chip warning" onClick={() => setActiveTab('waitlist')}>
                      📋 {pendingReviewWaitlist.length} application{pendingReviewWaitlist.length > 1 ? 's' : ''} pending review
                    </button>
                  )}
                  {stats.pendingCount > 0 && (
                    <button className="notification-chip danger" onClick={() => setActiveTab('brands')}>
                      💰 {stats.pendingCount} brand{stats.pendingCount > 1 ? 's' : ''} haven't paid yet
                    </button>
                  )}
                </div>
              )}

              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-label">Revenue</div>
                  <div className="kpi-value">{(stats.totalRevenue / 1000).toFixed(0)}<span className="kpi-unit">k EGP</span></div>
                  <div className="kpi-trend up">↑ {stats.paidCount} paid</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Booths Sold</div>
                  <div className="kpi-value">{stats.boothsSold}</div>
                  <div className="kpi-trend">{stats.pendingCount} pending</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Waitlist</div>
                  <div className="kpi-value">{stats.waitlistCount}</div>
                  <div className="kpi-trend">{stats.pendingReviewCount} to review</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">QR Scans</div>
                  <div className="kpi-value">{stats.totalScanCount}</div>
                  <div className="kpi-trend">{stats.checkedInCount} checked in</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="data-table-wrapper" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>Recent Activity</h3>
                {bookings.slice(0, 5).map((b, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: b.status === 'Paid' ? 'var(--color-success)' : b.status === 'Checked In' ? 'var(--color-teal)' : 'var(--color-warning)' }} />
                    <div>
                      <div className="activity-text"><strong>{b.brand}</strong> — Booth {b.boothId} · {b.status}</div>
                      <div className="activity-time">{b.date} · {b.amount.toLocaleString()} EGP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════ BRANDS TAB ════════════════════ */}
          {activeTab === 'brands' && (
            <div className="animate-in">
              <div className="data-table-wrapper">
                <div className="data-table-header">
                  <h3 style={{ fontFamily: 'var(--font-serif)' }}>Brand Management</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <div className="search-input" style={{ width: '240px', minWidth: '180px', flexShrink: 1 }}>
                      <span>🔍</span>
                      <input placeholder="Search brands..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    {hasPermission(user, 'canExportData') && (
                      <button className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => exportToCSV(bookings)}>📥 Export</button>
                    )}
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Booth</th><th>Brand</th><th>Category</th><th>Phone</th><th>Amount</th><th>Status</th><th>Tax</th>
                        {hasPermission(user, 'canEditBrand') && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => (
                        <tr key={b.id}>
                          <td data-label="Booth" style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{b.boothId}</td>
                          <td data-label="Brand">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={`/logos/${b.boothId}.jpg`} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} onError={e => e.target.style.display = 'none'} />
                              <div>
                                <div style={{ fontWeight: 600 }}>{b.brand}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{b.instagram}</div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Category" style={{ fontSize: '0.78rem' }}>{b.category}</td>
                          <td data-label="Phone" style={{ fontSize: '0.78rem' }}>{b.phone}</td>
                          <td data-label="Amount" style={{ fontWeight: 600 }}>{b.amount.toLocaleString()}</td>
                          <td data-label="Status">
                            <span className={`badge ${b.status === 'Paid' ? 'badge-paid' : b.status === 'Checked In' ? 'badge-checked-in' : 'badge-pending'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td data-label="Tax">{b.taxCardUploaded ? '✅' : '❌'}</td>
                          {hasPermission(user, 'canEditBrand') && (
                            <td data-label="Actions">
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditForm({ ...b }); setEditModal(b); }}>✏️</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setLogModal(b)}>📋</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ WAITLIST TAB ════════════════════ */}
          {activeTab === 'waitlist' && (
            <div className="animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>Waiting List</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pendingReviewWaitlist.length} pending review · {waitlist.filter(w => w.status === 'approved').length} approved · {waitlist.filter(w => w.status === 'rejected').length} rejected</p>
                </div>
                {hasPermission(user, 'canExportData') && (
                  <button className="btn btn-outline btn-sm" onClick={() => exportWaitlistCSV(waitlist)}>📥 Export Waitlist</button>
                )}
              </div>

              {/* Tab filters */}
              <div className="tab-pills" style={{ marginBottom: 'var(--space-lg)' }}>
                {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
                  <button key={tab} className={`tab-pill ${searchQuery === tab.toLowerCase() || (!searchQuery && tab === 'All') ? 'active' : ''}`}
                    onClick={() => setSearchQuery(tab === 'All' ? '' : tab.toLowerCase())}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="data-table-wrapper">
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Brand</th><th>Category</th><th>Phone</th><th>Tax Card</th><th>Status</th><th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist
                        .filter(w => {
                          if (!searchQuery) return true;
                          if (searchQuery === 'pending') return w.status === 'pending_review';
                          if (searchQuery === 'approved') return w.status === 'approved';
                          if (searchQuery === 'rejected') return w.status === 'rejected';
                          return true;
                        })
                        .map((w, i) => (
                        <tr key={w.id}>
                          <td data-label="#" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{w.position || i + 1}</td>
                          <td data-label="Brand">
                            <div>
                              <div style={{ fontWeight: 600 }}>{w.brand}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{w.instagram}</div>
                            </div>
                          </td>
                          <td data-label="Category" style={{ fontSize: '0.78rem' }}>{w.category}</td>
                          <td data-label="Phone" style={{ fontSize: '0.78rem' }}>{w.phone}</td>
                          <td data-label="Tax Card">{w.taxCardUploaded ? '✅' : '❌'}</td>
                          <td data-label="Status">
                            <span className={`badge ${
                              w.status === 'pending_review' ? 'badge-pending-review' :
                              w.status === 'approved' ? 'badge-approved' :
                              w.status === 'rejected' ? 'badge-rejected' :
                              w.status === 'promoted' ? 'badge-promoted' : 'badge-waitlisted'
                            }`}>
                              {w.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td data-label="Review">
                            {(w.status === 'pending_review') && hasPermission(user, 'canReviewRequests') && (
                              <button className="btn btn-primary btn-sm" onClick={() => { setReviewModal(w); setRejectionReason(''); }}>
                                Review
                              </button>
                            )}
                            {w.status === 'approved' && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>✓ by {w.reviewedBy}</span>
                            )}
                            {w.status === 'rejected' && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)' }}>✗ {w.rejectionReason?.substring(0, 20)}...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ FLOOR PLAN TAB ════════════════════ */}
          {activeTab === 'map' && (
            <div className="animate-in">
              <h2 style={{ marginBottom: 'var(--space-md)' }}>Floor Plan</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>View the live floor plan on the public booking page.</p>
              <a href="/b/lydia-demo" target="_blank" className="btn btn-primary">Open Floor Plan ↗</a>
            </div>
          )}

          {/* ════════════════════ QR SCANNER TAB ════════════════════ */}
          {activeTab === 'qr' && (
            <div className="animate-in">
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '4px', textAlign: 'center' }}>QR Scanner</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                  Scan brand QR codes for check-in/check-out at gates
                </p>

                {isScanning || !scanResult ? (
                  <>
                    {/* Visual Scanner */}
                    <div className="qr-viewfinder">
                      <div className="qr-corner-bl" />
                      <div className="qr-corner-br" />
                      <div className="qr-scan-line" />
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', textAlign: 'center', lineHeight: 1.5 }}>
                        Point camera at<br />brand QR code
                      </div>
                    </div>

                    {/* Manual Input */}
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Or enter booth ID manually</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="search-input" style={{ flex: 1 }}>
                          <span>🔎</span>
                          <input
                            placeholder="e.g., C1, A10, L12..."
                            value={scanBoothId}
                            onChange={e => setScanBoothId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleQRScan()}
                          />
                        </div>
                        <button className="btn btn-primary" onClick={handleQRScan} disabled={!scanBoothId.trim()}>Scan</button>
                      </div>
                    </div>

                    {/* Gate + Scanner Identity */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Gate</label>
                        <select className="input" value={scanGate} onChange={e => setScanGate(e.target.value)}>
                          <option>Gate A</option><option>Gate B</option><option>Gate C</option><option>Gate D</option>
                        </select>
                      </div>
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Scanner</label>
                        <input className="input" value={user?.name || 'Unknown'} disabled />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Scan Result Card */
                  <div className="qr-success-card" style={{
                    background: scanResult.error ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                    border: `1px solid ${scanResult.error ? 'rgba(155,59,48,0.2)' : 'rgba(61,107,79,0.2)'}`,
                    borderRadius: 'var(--radius-xl)', padding: '32px', textAlign: 'center',
                  }}>
                    {scanResult.error ? (
                      <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❌</div>
                        <h3 style={{ marginBottom: '8px', color: 'var(--color-danger)' }}>Not Found</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{scanResult.message}</p>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                          {scanResult.event.includes('Check-in') ? '✅' : '👋'}
                        </div>
                        {/* Brand Logo */}
                        <img
                          src={`/logos/${scanResult.booking.boothId}.jpg`}
                          alt={scanResult.booking.brand}
                          style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-success)', margin: '0 auto 12px', display: 'block' }}
                          onError={e => e.target.style.display = 'none'}
                        />
                        <h3 style={{ marginBottom: '4px' }}>{scanResult.booking.brand}</h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Booth {scanResult.booking.boothId} · {scanResult.booking.category}
                        </div>
                        <div style={{
                          display: 'inline-block', padding: '6px 16px', borderRadius: 'var(--radius-full)',
                          background: scanResult.event.includes('Check-in') ? 'var(--color-success)' : 'var(--color-warning)',
                          color: '#fff', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em',
                        }}>
                          {scanResult.event}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                          {new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {scanGate} · {user?.name}
                        </div>
                      </>
                    )}
                    <button className="btn btn-primary btn-block" style={{ marginTop: '20px' }} onClick={() => { setScanResult(null); setIsScanning(true); }}>
                      Scan Another
                    </button>
                  </div>
                )}

                {/* Today's Scan Log */}
                <div style={{ marginTop: 'var(--space-xl)' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', fontFamily: 'var(--font-serif)' }}>Today's Scan Log</h3>
                  <div className="data-table-wrapper">
                    {bookings.filter(b => b.scanLog?.length > 0).length > 0 ? (
                      <div style={{ padding: '12px' }}>
                        {bookings
                          .flatMap(b => (b.scanLog || []).map(s => ({ ...s, brand: b.brand, boothId: b.boothId })))
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                          .slice(0, 10)
                          .map((scan, i) => (
                            <div key={i} className="activity-item">
                              <div className="activity-dot" style={{ background: scan.event.includes('Check-in') ? 'var(--color-success)' : 'var(--color-warning)' }} />
                              <div style={{ flex: 1 }}>
                                <div className="activity-text"><strong>{scan.brand}</strong> — {scan.event}</div>
                                <div className="activity-time">
                                  {new Date(scan.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {scan.gate} · {scan.scannedBy}
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">📱</div>
                        <div className="empty-state-text">No scans recorded today</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ SETTINGS TAB ════════════════════ */}
          {activeTab === 'settings' && (
            <div className="animate-in">
              <h2 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-xl)' }}>Settings</h2>

              {/* Bazaar Settings */}
              <div className="data-table-wrapper" style={{ padding: '32px', maxWidth: '600px', marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '20px' }}>Bazaar Settings</h3>
                <div className="input-group">
                  <label>Bazaar Name</label>
                  <input className="input" defaultValue="Summer Breeze: 2nd Edition" />
                </div>
                <div className="input-group">
                  <label>Event Date</label>
                  <input className="input" type="date" defaultValue="2026-07-03" />
                </div>
                <div className="input-group">
                  <label>Priority Booking Deadline</label>
                  <input className="input" type="date" defaultValue="2026-06-23" />
                </div>
                <div className="input-group">
                  <label>Location</label>
                  <input className="input" defaultValue="Hall 1, Egypt International Exhibition Center" />
                </div>
                <div className="input-group">
                  <label>Current Phase</label>
                  <select className="input" value={currentPhase} onChange={e => handlePhaseChange(e.target.value)}>
                    <option value="priority_booking">Priority Booking (Returning Brands)</option>
                    <option value="waitlist_open">Open Applications (New Brands)</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => showNotification('✅ Settings saved')}>Save Settings</button>
              </div>

              {/* Team Management */}
              {hasPermission(user, 'canManageOrganizers') && (
                <div className="data-table-wrapper" style={{ padding: '32px', maxWidth: '600px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)' }}>Team Management</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setAddOrgModal(true)}>+ Add Organizer</button>
                  </div>

                  {getOrganizers().map(org => (
                    <div key={org.id} className="organizer-card">
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                        {org.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{org.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{org.email} · {getRoleLabel(org.role)}</div>
                      </div>
                      {org.id !== user?.id && org.id !== 'admin' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveOrganizer(org.id)} style={{ color: 'var(--color-danger)', fontSize: '0.72rem' }}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ═══ Mobile Bottom Tab Nav ═══ */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {sidebarItems.slice(0, 5).map(item => (
            <button key={item.id} className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span className="mobile-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'waitlist' && pendingReviewWaitlist.length > 0 && (
                <span className="mobile-nav-badge">{pendingReviewWaitlist.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Edit Brand Modal ═══ */}
      {editModal && (
        <>
          <div className="booking-panel-overlay open" onClick={() => setEditModal(null)} style={{ zIndex: 999 }} />
          <div className="booking-panel open" style={{ zIndex: 1000, maxWidth: '520px' }}>
            <button className="booking-panel-close" onClick={() => setEditModal(null)}>✕</button>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', fontFamily: 'var(--font-serif)' }}>Edit Brand</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px' }}>Booth {editForm.boothId}</p>

            <div className="input-group"><label>Brand Name</label><input className="input" value={editForm.brand || ''} onChange={e => setEditForm(p => ({ ...p, brand: e.target.value }))} /></div>
            <div className="input-group"><label>Category</label>
              <select className="input" value={editForm.category || ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                <option>Fashion Icons</option><option>Beauty Icons</option><option>Home Essentials</option><option>Natural Blends</option><option>Accessories</option>
              </select>
            </div>
            <div className="input-group"><label>Phone</label><input className="input" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="input-group"><label>Instagram</label><input className="input" value={editForm.instagram || ''} onChange={e => setEditForm(p => ({ ...p, instagram: e.target.value }))} /></div>
            <div className="input-group"><label>Email</label><input className="input" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="input-group"><label>Booth ID</label><input className="input" value={editForm.boothId || ''} onChange={e => setEditForm(p => ({ ...p, boothId: e.target.value }))} /></div>
            <div className="input-group"><label>Status</label>
              <select className="input" value={editForm.status || ''} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                <option>Paid</option><option>Pending Approval</option><option>Checked In</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline btn-block" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </>
      )}

      {/* ═══ Scan Log Modal ═══ */}
      {logModal && (
        <>
          <div className="booking-panel-overlay open" onClick={() => setLogModal(null)} style={{ zIndex: 999 }} />
          <div className="booking-panel open" style={{ zIndex: 1000, maxWidth: '520px' }}>
            <button className="booking-panel-close" onClick={() => setLogModal(null)}>✕</button>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', fontFamily: 'var(--font-serif)' }}>Scan History</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px' }}>{logModal.brand} — Booth {logModal.boothId}</p>

            {logModal.scanLog?.length > 0 ? (
              <div>
                {logModal.scanLog.map((scan, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: scan.event.includes('Check-in') ? 'var(--color-success)' : 'var(--color-warning)' }} />
                    <div>
                      <div className="activity-text">{scan.event}</div>
                      <div className="activity-time">
                        {new Date(scan.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' • '}{scan.gate} • {scan.scannedBy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📱</div>
                <div className="empty-state-text">No scans recorded yet</div>
              </div>
            )}

            <button className="btn btn-outline btn-block" onClick={() => setLogModal(null)} style={{ marginTop: '20px' }}>Close</button>
          </div>
        </>
      )}

      {/* ═══ Manual Reserve Modal ═══ */}
      {reserveModal && (
        <>
          <div className="booking-panel-overlay open" onClick={() => setReserveModal(false)} style={{ zIndex: 999 }} />
          <div className="booking-panel open" style={{ zIndex: 1000, maxWidth: '520px' }}>
            <button className="booking-panel-close" onClick={() => setReserveModal(false)}>✕</button>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', fontFamily: 'var(--font-serif)' }}>Manual Reservation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px' }}>Reserve a booth for a VIP or sponsor without payment gateway.</p>

            <div className="input-group"><label>Booth ID</label><input className="input" placeholder="e.g., C4" value={reserveForm.boothId} onChange={e => setReserveForm(p => ({ ...p, boothId: e.target.value }))} /></div>
            <div className="input-group"><label>Brand Name</label><input className="input" placeholder="e.g., L'Oreal" value={reserveForm.brand} onChange={e => setReserveForm(p => ({ ...p, brand: e.target.value }))} /></div>
            <div className="input-group"><label>Category</label>
              <select className="input" value={reserveForm.category} onChange={e => setReserveForm(p => ({ ...p, category: e.target.value }))}>
                <option>Fashion Icons</option><option>Beauty Icons</option><option>Home Essentials</option><option>Natural Blends</option><option>Accessories</option>
              </select>
            </div>
            <div className="input-group"><label>Phone</label><input className="input" placeholder="+20 1xx xxx xxxx" value={reserveForm.phone} onChange={e => setReserveForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="input-group"><label>Reason</label>
              <select className="input" value={reserveForm.reason} onChange={e => setReserveForm(p => ({ ...p, reason: e.target.value }))}>
                <option>VIP Sponsor</option><option>Paid via Bank Transfer</option><option>Internal Use</option><option>Partner Exchange</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline btn-block" onClick={() => setReserveModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={handleManualReserve} disabled={!reserveForm.boothId || !reserveForm.brand}>Confirm Reservation</button>
            </div>
          </div>
        </>
      )}

      {/* ═══ Request Review Modal ═══ */}
      {reviewModal && (
        <>
          <div className="booking-panel-overlay open" onClick={() => setReviewModal(null)} style={{ zIndex: 999 }} />
          <div className="booking-panel open" style={{ zIndex: 1000, maxWidth: '580px' }}>
            <button className="booking-panel-close" onClick={() => setReviewModal(null)}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📋</div>
              <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '2px', fontFamily: 'var(--font-serif)' }}>Review Application</h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Applied on {new Date(reviewModal.dateJoined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Brand Details */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
              <div className="review-detail-row"><span className="review-detail-label">Owner</span><span className="review-detail-value">{reviewModal.ownerName || '-'}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Brand Name</span><span className="review-detail-value">{reviewModal.brand}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Category</span><span className="review-detail-value">{reviewModal.category}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Egyptian Brand</span><span className="review-detail-value">{reviewModal.isEgyptianBrand || '-'}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Joined LA Before</span><span className="review-detail-value">{reviewModal.joinedBefore || '-'}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Phone</span><span className="review-detail-value">{reviewModal.phone}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Instagram</span><span className="review-detail-value">{reviewModal.instagram}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Email</span><span className="review-detail-value">{reviewModal.email}</span></div>
              <div className="review-detail-row"><span className="review-detail-label">Preferred Zone</span><span className="review-detail-value">{reviewModal.preferredZone?.replace(/_/g, ' ')}</span></div>
            </div>

            {/* Requested Dates */}
            {reviewModal.datesToJoin && reviewModal.datesToJoin.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>Requested Events (2026)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {reviewModal.datesToJoin.map((date, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      📅 {date}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message from Brand */}
            {reviewModal.requestMessage && (
              <div style={{ background: 'var(--color-info-light)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '16px', border: '1px solid rgba(59,107,138,0.12)' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-info)', fontWeight: 700, marginBottom: '6px' }}>Brand Brief</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>"{reviewModal.requestMessage}"</div>
              </div>
            )}

            {/* Tax Card */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>Tax Card</div>
              {reviewModal.taxCardUploaded && reviewModal.taxCardImage ? (
                <img
                  src={reviewModal.taxCardImage}
                  alt="Tax Card"
                  className="tax-card-preview"
                  onClick={(e) => e.target.classList.toggle('zoomed')}
                />
              ) : (
                <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light)', border: '1px solid rgba(155,59,48,0.12)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>❌</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-danger)' }}>Tax card not uploaded</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>This brand hasn't provided their tax registration document.</div>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            <div className="input-group">
              <label>Rejection Reason (required to reject)</label>
              <textarea
                className="input"
                placeholder="e.g., Tax card not matching brand name, missing documents..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={{ minHeight: '60px' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button className="btn btn-danger btn-block" onClick={() => handleRejectRequest(reviewModal)} disabled={!rejectionReason.trim()}>
                ❌ Reject
              </button>
              <button className="btn btn-success btn-block" onClick={() => handleApproveRequest(reviewModal)}>
                ✅ Approve & Send Link
              </button>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
              Both actions will open WhatsApp to send the brand a message
            </p>
          </div>
        </>
      )}

      {/* ═══ Add Organizer Modal ═══ */}
      {addOrgModal && (
        <>
          <div className="booking-panel-overlay open" onClick={() => setAddOrgModal(false)} style={{ zIndex: 999 }} />
          <div className="booking-panel open" style={{ zIndex: 1000, maxWidth: '480px' }}>
            <button className="booking-panel-close" onClick={() => setAddOrgModal(false)}>✕</button>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px', fontFamily: 'var(--font-serif)' }}>Add Organizer</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px' }}>New team member for your bazaar</p>

            <div className="input-group"><label>Full Name *</label><input className="input" placeholder="e.g., Ahmed Mohamed" value={newOrgForm.name} onChange={e => setNewOrgForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="input-group"><label>Email *</label><input className="input" type="email" placeholder="ahmed@email.com" value={newOrgForm.email} onChange={e => setNewOrgForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="input-group"><label>Password *</label><input className="input" type="password" placeholder="Min 6 characters" value={newOrgForm.password} onChange={e => setNewOrgForm(p => ({ ...p, password: e.target.value }))} /></div>
            <div className="input-group"><label>Role</label>
              <select className="input" value={newOrgForm.role} onChange={e => setNewOrgForm(p => ({ ...p, role: e.target.value }))}>
                <option value="organizer">Organizer (Full Access)</option>
                <option value="gate_organizer">Gate Staff (QR Scanner Only)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Avatar</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AVATAR_OPTIONS.map(emoji => (
                  <button key={emoji} onClick={() => setNewOrgForm(p => ({ ...p, avatar: emoji }))}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', border: newOrgForm.avatar === emoji ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      background: newOrgForm.avatar === emoji ? 'var(--color-gold-light)' : 'var(--bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline btn-block" onClick={() => setAddOrgModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={handleAddOrganizer} disabled={!newOrgForm.name || !newOrgForm.email || !newOrgForm.password}>
                Add to Team
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ Phase Change Confirmation ═══ */}
      {phaseConfirmModal && (
        <>
          <div className="booking-panel-overlay open" onClick={() => setPhaseConfirmModal(null)} style={{ zIndex: 999 }} />
          <div className="booking-panel open" style={{ zIndex: 1000, maxWidth: '440px' }}>
            <button className="booking-panel-close" onClick={() => setPhaseConfirmModal(null)}>✕</button>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>Change Phase?</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                {phaseConfirmModal === PHASES.WAITLIST_OPEN
                  ? `This will switch the booking page to "Open Applications" mode. New brands will apply through a waiting list instead of booking directly.`
                  : phaseConfirmModal === PHASES.PRIORITY_BOOKING
                  ? `This will switch back to "Priority Booking" mode. Only returning brands can book directly.`
                  : `This will mark all booths as sold out. No more bookings or applications will be accepted.`
                }
              </p>
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                📊 Current stats: <strong>{stats.boothsSold}</strong> booths sold · <strong>{stats.waitlistCount}</strong> on waitlist
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline btn-block" onClick={() => setPhaseConfirmModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-block" onClick={confirmPhaseChange}>Confirm Change</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ AI Copilot ═══ */}
      <AiCopilot isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} contextData={bookings} waitlistData={waitlist} />
    </>
  );
}
