/*
  BAZAAR-OS — Booking Engine v2
  ==============================
  Two-phase reservation system with admin-controlled manual switching:
  Phase 1 (Priority Booking): Returning/verified brands book directly → choose booth → pay
  Phase 2 (Open Applications): New brands submit applications → admin reviews → approve/reject
  
  Phase state is stored in localStorage so the demo page and admin dashboard share it.
*/

// ── Bazaar Phases ──────────────────────────────────────────
export const PHASES = {
  PRIORITY_BOOKING: 'priority_booking',   // Only returning brands can book directly
  WAITLIST_OPEN: 'waitlist_open',         // New brands apply through waiting list
  SOLD_OUT: 'sold_out',
};

// ── Phase State Management (localStorage) ──────────────────
const PHASE_STORAGE_KEY = 'bazaar_os_current_phase';

export function getCurrentPhase() {
  if (typeof window === 'undefined') return PHASES.PRIORITY_BOOKING;
  return localStorage.getItem(PHASE_STORAGE_KEY) || PHASES.PRIORITY_BOOKING;
}

export function setCurrentPhase(phase) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PHASE_STORAGE_KEY, phase);
  // Dispatch a storage event so other tabs/components can react
  window.dispatchEvent(new StorageEvent('storage', { key: PHASE_STORAGE_KEY, newValue: phase }));
}

// ── Booth Statuses ─────────────────────────────────────────
export const BOOTH_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',     // Returning brand reserved, payment pending
  PAID: 'paid',             // Payment confirmed
  WAITLISTED: 'waitlisted', // A waitlist brand is interested
  CHECKED_IN: 'checked_in', // Brand arrived (QR scanned on prep/bazaar day)
};

// ── Brand Types ────────────────────────────────────────────
export const BRAND_TYPE = {
  RETURNING: 'returning',   // Has priority access → direct booking in Phase 1
  NEW: 'new',               // Can only apply through waitlist in Phase 2
};

// ── Application / Request Statuses ─────────────────────────
export const REQUEST_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROMOTED: 'promoted',      // Assigned a booth
};

// ── Mock Data: Returning Brands (Lydie's old customers) ────
export const RETURNING_BRANDS = [
  { id: 'RB001', name: 'AMALEID', category: 'Fashion Icons', phone: '+20 100 111 2222', instagram: '@amaleid', email: 'amaleid@email.com', taxCard: true },
  { id: 'RB002', name: 'DRESS CODE', category: 'Fashion Icons', phone: '+20 100 333 4444', instagram: '@dresscode.eg', email: 'dresscode@email.com', taxCard: true },
  { id: 'RB003', name: 'BEINJI', category: 'Beauty Icons', phone: '+20 111 555 6666', instagram: '@beinji', email: 'beinji@email.com', taxCard: true },
  { id: 'RB004', name: 'MOONLIGHT', category: 'Fashion Icons', phone: '+20 122 777 8888', instagram: '@moonlight.eg', email: 'moonlight@email.com', taxCard: false },
  { id: 'RB005', name: 'TON ODEUR', category: 'Beauty Icons', phone: '+20 155 999 0000', instagram: '@tonodeur', email: 'tonodeur@email.com', taxCard: true },
];

// ── Mock Data: Bookings ────────────────────────────────────
export function createInitialBookings() {
  return [
    { 
      id: 'BK001', boothId: 'C1', brand: 'AMALEID', brandType: BRAND_TYPE.RETURNING,
      category: 'Fashion Icons', phone: '+20 100 111 2222', instagram: '@amaleid',
      email: 'amaleid@email.com', amount: 25000, status: 'Paid', taxCardUploaded: true,
      date: '2 days ago', paidAt: '2026-06-16T10:30:00',
      scanLog: [
        { timestamp: '2026-07-02T09:00:00', event: 'Prep Day Check-in', gate: 'Gate A', scannedBy: 'Lydia Akram' },
        { timestamp: '2026-07-02T17:30:00', event: 'Prep Day Check-out', gate: 'Gate A', scannedBy: 'Lydia Akram' },
      ]
    },
    { 
      id: 'BK002', boothId: 'C9', brand: 'DRESS CODE', brandType: BRAND_TYPE.RETURNING,
      category: 'Fashion Icons', phone: '+20 100 333 4444', instagram: '@dresscode.eg',
      email: 'dresscode@email.com', amount: 25000, status: 'Paid', taxCardUploaded: true,
      date: '1 day ago', paidAt: '2026-06-17T14:15:00',
      scanLog: []
    },
    { 
      id: 'BK003', boothId: 'A1', brand: 'BEINJI', brandType: BRAND_TYPE.RETURNING,
      category: 'Beauty Icons', phone: '+20 111 555 6666', instagram: '@beinji',
      email: 'beinji@email.com', amount: 18000, status: 'Paid', taxCardUploaded: true,
      date: '3 hrs ago', paidAt: '2026-06-17T21:00:00',
      scanLog: []
    },
    { 
      id: 'BK004', boothId: 'C13', brand: 'MOONLIGHT', brandType: BRAND_TYPE.RETURNING,
      category: 'Fashion Icons', phone: '+20 122 777 8888', instagram: '@moonlight.eg',
      email: 'moonlight@email.com', amount: 25000, status: 'Pending Approval', taxCardUploaded: false,
      date: '5 hrs ago', paidAt: null,
      scanLog: []
    },
    { 
      id: 'BK005', boothId: 'A10', brand: 'TON ODEUR', brandType: BRAND_TYPE.RETURNING,
      category: 'Beauty Icons', phone: '+20 155 999 0000', instagram: '@tonodeur',
      email: 'tonodeur@email.com', amount: 18000, status: 'Paid', taxCardUploaded: true,
      date: 'Yesterday', paidAt: '2026-06-16T20:00:00',
      scanLog: [
        { timestamp: '2026-07-02T08:45:00', event: 'Prep Day Check-in', gate: 'Gate B', scannedBy: 'Lydia Akram' },
      ]
    },
    {
      id: 'BK006', boothId: 'L12', brand: 'Sweet Treats', brandType: BRAND_TYPE.NEW,
      category: 'Natural Blends', phone: '+20 100 123 4567', instagram: '@sweettreats',
      email: 'sweet@email.com', amount: 4000, status: 'Paid', taxCardUploaded: true,
      date: '6 hrs ago', paidAt: '2026-06-17T18:00:00',
      scanLog: []
    },
    {
      id: 'BK007', boothId: 'R8', brand: 'Handmade Co', brandType: BRAND_TYPE.NEW,
      category: 'Home Essentials', phone: '+20 100 999 8888', instagram: '@handmadeco',
      email: 'handmade@email.com', amount: 4000, status: 'Paid', taxCardUploaded: true,
      date: 'Yesterday', paidAt: '2026-06-16T15:00:00',
      scanLog: []
    },
  ];
}

// ── Mock Data: Waiting List / Applications ─────────────────
export function createInitialWaitlist() {
  return [
    {
      id: 'WL001', brand: 'Nora Accessories', category: 'Accessories',
      phone: '+20 100 222 3333', instagram: '@noraacc', email: 'nora@email.com',
      taxCardUploaded: true, taxCardImage: '/logos/A8.jpg',
      preferredZone: 'standard_left', dateJoined: '2026-06-15T10:00:00',
      position: 1, status: 'pending_review',
      requestMessage: 'We were part of the last season and would love to return!',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL002', brand: 'Linen & Co.', category: 'Fashion Icons',
      phone: '+20 111 444 5555', instagram: '@linenco', email: 'linen@email.com',
      taxCardUploaded: true, taxCardImage: '/logos/C3.jpg',
      preferredZone: 'fashion_icon', dateJoined: '2026-06-15T14:30:00',
      position: 2, status: 'pending_review',
      requestMessage: 'High-end linen fashion brand, great Instagram presence.',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL003', brand: 'Sahara Candles', category: 'Home Essentials',
      phone: '+20 122 666 7777', instagram: '@saharacandles', email: 'sahara@email.com',
      taxCardUploaded: false, taxCardImage: null,
      preferredZone: 'standard_right', dateJoined: '2026-06-16T09:00:00',
      position: 3, status: 'pending_review',
      requestMessage: '',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL004', brand: 'Glam Studio', category: 'Beauty Icons',
      phone: '+20 155 888 9999', instagram: '@glamstudio', email: 'glam@email.com',
      taxCardUploaded: true, taxCardImage: '/logos/A5.jpg',
      preferredZone: 'beauty_icon', dateJoined: '2026-06-16T11:15:00',
      position: 4, status: 'pending_review',
      requestMessage: '',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL006', brand: 'Fresh Bakes', category: 'Natural Blends',
      phone: '+20 111 030 4040', instagram: '@freshbakes', email: 'fresh@email.com',
      taxCardUploaded: true, taxCardImage: '/logos/B1.jpg',
      preferredZone: 'standard_right', dateJoined: '2026-06-17T08:00:00',
      position: 6, status: 'pending_review',
      requestMessage: 'Organic baked goods — sourdough, pastries, artisan breads.',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL007', brand: 'Velvet Rose', category: 'Beauty Icons',
      phone: '+20 122 050 6060', instagram: '@velvetrose', email: 'velvet@email.com',
      taxCardUploaded: false, taxCardImage: null,
      preferredZone: 'beauty_icon', dateJoined: '2026-06-17T12:00:00',
      position: 7, status: 'pending_review',
      requestMessage: '',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL008', brand: 'Clay & Craft', category: 'Home Essentials',
      phone: '+20 155 070 8080', instagram: '@claycraft', email: 'clay@email.com',
      taxCardUploaded: true, taxCardImage: '/logos/D1.jpg',
      preferredZone: 'standard_left', dateJoined: '2026-06-17T15:30:00',
      position: 8, status: 'pending_review',
      requestMessage: 'Handmade pottery and ceramics. We were recommended by Nora Accessories.',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
  ];
}

export function getWaitlist() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('bazaar_os_waitlist');
  if (stored) return JSON.parse(stored);
  const initial = createInitialWaitlist();
  localStorage.setItem('bazaar_os_waitlist', JSON.stringify(initial));
  return initial;
}

export function addToWaitlist(application) {
  const waitlist = getWaitlist();
  const newApp = {
    id: `WL${String(waitlist.length + 1).padStart(3, '0')}`,
    ...application,
    dateJoined: new Date().toISOString(),
    position: waitlist.length + 1,
    status: 'pending_review',
    reviewedAt: null, reviewedBy: null, rejectionReason: null,
  };
  waitlist.push(newApp);
  localStorage.setItem('bazaar_os_waitlist', JSON.stringify(waitlist));
  window.dispatchEvent(new StorageEvent('storage', { key: 'bazaar_os_waitlist', newValue: JSON.stringify(waitlist) }));
  return newApp;
}

// ── Promotion Logic ────────────────────────────────────────
export function promoteFromWaitlist(waitlist, bookings, availableBoothId, boothZone, boothPrice) {
  // Find next approved or waiting brand
  const nextBrand = waitlist.find(w => w.status === 'approved' || w.status === 'pending_review');
  if (!nextBrand) return { waitlist, bookings, promoted: null };

  // Create booking for promoted brand
  const newBooking = {
    id: `BK${String(bookings.length + 1).padStart(3, '0')}`,
    boothId: availableBoothId,
    brand: nextBrand.brand,
    brandType: BRAND_TYPE.NEW,
    category: nextBrand.category,
    phone: nextBrand.phone,
    instagram: nextBrand.instagram,
    email: nextBrand.email,
    amount: boothPrice,
    status: 'Pending Approval',
    taxCardUploaded: nextBrand.taxCardUploaded,
    date: 'Just now',
    paidAt: null,
    scanLog: [],
  };

  // Update waitlist status
  const updatedWaitlist = waitlist.map(w => 
    w.id === nextBrand.id 
      ? { ...w, status: 'promoted', promotedTo: availableBoothId } 
      : w
  );

  // Reindex positions
  let pos = 1;
  const reindexed = updatedWaitlist.map(w => {
    if (w.status === 'pending_review' || w.status === 'approved') {
      return { ...w, position: pos++ };
    }
    return w;
  });

  return {
    waitlist: reindexed,
    bookings: [...bookings, newBooking],
    promoted: { brand: nextBrand.brand, booth: availableBoothId },
  };
}

// ── Approve / Reject Logic ─────────────────────────────────
export function approveRequest(waitlist, requestId, reviewerName) {
  return waitlist.map(w =>
    w.id === requestId
      ? { ...w, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: reviewerName }
      : w
  );
}

export function rejectRequest(waitlist, requestId, reviewerName, reason) {
  return waitlist.map(w =>
    w.id === requestId
      ? { ...w, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: reviewerName, rejectionReason: reason }
      : w
  );
}

// ── WhatsApp Message Generators ────────────────────────────
export function generateApprovalMessage(brand, paymentUrl) {
  return `Hello ${brand}! 🎉\n\nGreat news! Your booth application for *Summer Breeze: 2nd Edition* has been approved!\n\nPlease complete your payment using this link:\n${paymentUrl}\n\n⏰ Payment must be completed within 48 hours to secure your booth.\n\nSee you at the bazaar! ✨\n— L.A Market Team`;
}

export function generateRejectionMessage(brand, reason) {
  return `Hello ${brand},\n\nThank you for your interest in *Summer Breeze: 2nd Edition*.\n\nUnfortunately, we were unable to approve your application at this time.\n${reason ? `\nReason: ${reason}\n` : ''}\nWe hope to see you at our next event! 🌟\n\n— L.A Market Team`;
}

export function generateWhatsAppUrl(phone, message) {
  // Clean phone number — remove spaces, dashes, and ensure it starts with country code
  const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// ── QR Scan Logger ─────────────────────────────────────────
export function logQRScan(bookings, boothId, event, gate, scannedBy) {
  return bookings.map(b => {
    if (b.boothId === boothId) {
      return {
        ...b,
        scanLog: [...b.scanLog, {
          timestamp: new Date().toISOString(),
          event,
          gate: gate || 'Gate A',
          scannedBy: scannedBy || 'Unknown',
        }],
        status: event.includes('Check-in') ? 'Checked In' : b.status,
      };
    }
    return b;
  });
}

// ── CSV Export ──────────────────────────────────────────────
export function exportToCSV(bookings, filename = 'bazaar-brands.csv') {
  const headers = ['Booth ID', 'Brand', 'Type', 'Category', 'Phone', 'Instagram', 'Email', 'Amount (EGP)', 'Status', 'Tax Card', 'Paid At', 'Scan Count'];
  
  const rows = bookings.map(b => [
    b.boothId,
    b.brand,
    b.brandType,
    b.category,
    b.phone,
    b.instagram,
    b.email,
    b.amount,
    b.status,
    b.taxCardUploaded ? 'Uploaded' : 'Missing',
    b.paidAt || 'N/A',
    b.scanLog?.length || 0,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── Waitlist Export ────────────────────────────────────────
export function exportWaitlistCSV(waitlist, filename = 'bazaar-waitlist.csv') {
  const headers = ['Position', 'Brand', 'Category', 'Phone', 'Instagram', 'Email', 'Preferred Zone', 'Date Joined', 'Status', 'Tax Card', 'Message'];
  
  const rows = waitlist.map(w => [
    w.position,
    w.brand,
    w.category,
    w.phone,
    w.instagram,
    w.email,
    w.preferredZone,
    new Date(w.dateJoined).toLocaleDateString(),
    w.status,
    w.taxCardUploaded ? 'Uploaded' : 'Missing',
    w.requestMessage || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── Stats Calculator ───────────────────────────────────────
export function calculateStats(bookings, waitlist) {
  const paid = bookings.filter(b => b.status === 'Paid' || b.status === 'Checked In');
  const pending = bookings.filter(b => b.status === 'Pending Approval');
  const checkedIn = bookings.filter(b => b.status === 'Checked In');
  const totalRevenue = paid.reduce((sum, b) => sum + b.amount, 0);
  const pendingReview = waitlist.filter(w => w.status === 'pending_review');
  const waitlistActive = waitlist.filter(w => w.status === 'pending_review' || w.status === 'approved');

  return {
    totalRevenue,
    boothsSold: paid.length + pending.length,
    paidCount: paid.length,
    pendingCount: pending.length,
    checkedInCount: checkedIn.length,
    waitlistCount: waitlistActive.length,
    pendingReviewCount: pendingReview.length,
    totalScanCount: bookings.reduce((sum, b) => sum + (b.scanLog?.length || 0), 0),
  };
}
