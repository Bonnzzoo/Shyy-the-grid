/*
  BAZAAR-OS — Booking Service
  ============================
  Firestore CRUD for bookings (per-event subcollection).
  Falls back to localStorage demo data when Firebase is not configured.
*/

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db, isDemoMode } from './firebase';
import { BRAND_TYPE } from './bookingEngine';

// ── Demo Mode Storage ──
const DEMO_BOOKINGS_PREFIX = 'bazaar_os_bookings_';

function getDemoBookings(eventId) {
  if (typeof window === 'undefined') return createDefaultBookings();
  try {
    const stored = localStorage.getItem(DEMO_BOOKINGS_PREFIX + eventId);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { /* ignore */ }
  const defaults = createDefaultBookings();
  localStorage.setItem(DEMO_BOOKINGS_PREFIX + eventId, JSON.stringify(defaults));
  return defaults;
}

function saveDemoBookings(eventId, bookings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_BOOKINGS_PREFIX + eventId, JSON.stringify(bookings));
  window.dispatchEvent(new StorageEvent('storage', {
    key: DEMO_BOOKINGS_PREFIX + eventId,
    newValue: JSON.stringify(bookings),
  }));
}

function createDefaultBookings() {
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
      date: '1 day ago', paidAt: '2026-06-17T14:15:00', scanLog: []
    },
    {
      id: 'BK003', boothId: 'A1', brand: 'BEINJI', brandType: BRAND_TYPE.RETURNING,
      category: 'Beauty Icons', phone: '+20 111 555 6666', instagram: '@beinji',
      email: 'beinji@email.com', amount: 18000, status: 'Paid', taxCardUploaded: true,
      date: '3 hrs ago', paidAt: '2026-06-17T21:00:00', scanLog: []
    },
    {
      id: 'BK004', boothId: 'C13', brand: 'MOONLIGHT', brandType: BRAND_TYPE.RETURNING,
      category: 'Fashion Icons', phone: '+20 122 777 8888', instagram: '@moonlight.eg',
      email: 'moonlight@email.com', amount: 25000, status: 'Pending Approval', taxCardUploaded: false,
      date: '5 hrs ago', paidAt: null, scanLog: []
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
      date: '6 hrs ago', paidAt: '2026-06-17T18:00:00', scanLog: []
    },
    {
      id: 'BK007', boothId: 'R8', brand: 'Handmade Co', brandType: BRAND_TYPE.NEW,
      category: 'Home Essentials', phone: '+20 100 999 8888', instagram: '@handmadeco',
      email: 'handmade@email.com', amount: 4000, status: 'Paid', taxCardUploaded: true,
      date: 'Yesterday', paidAt: '2026-06-16T15:00:00', scanLog: []
    },
  ];
}

// ══════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════

/**
 * Get all bookings for an event
 */
export async function getBookings(eventId) {
  if (isDemoMode) {
    return getDemoBookings(eventId);
  }

  const colRef = collection(db, 'events', eventId, 'bookings');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to real-time booking changes
 */
export function subscribeToBookings(eventId, callback) {
  if (isDemoMode) {
    const handler = (e) => {
      if (e.key === DEMO_BOOKINGS_PREFIX + eventId) {
        callback(JSON.parse(e.newValue || '[]'));
      }
    };
    if (typeof window !== 'undefined') {
      callback(getDemoBookings(eventId));
      window.addEventListener('storage', handler);
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
    };
  }

  const colRef = collection(db, 'events', eventId, 'bookings');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Create a new booking
 */
export async function createBooking(eventId, data) {
  const bookingId = data.id || `BK${Date.now()}`;
  const bookingData = {
    ...data,
    id: bookingId,
    scanLog: data.scanLog || [],
    createdAt: new Date().toISOString(),
  };

  if (isDemoMode) {
    const bookings = getDemoBookings(eventId);
    bookings.unshift(bookingData);
    saveDemoBookings(eventId, bookings);
    return bookingData;
  }

  await setDoc(doc(db, 'events', eventId, 'bookings', bookingId), {
    ...bookingData,
    createdAt: serverTimestamp(),
  });
  return bookingData;
}

/**
 * Update a booking
 */
export async function updateBooking(eventId, bookingId, data) {
  if (isDemoMode) {
    const bookings = getDemoBookings(eventId);
    const idx = bookings.findIndex(b => b.id === bookingId || b.boothId === bookingId);
    if (idx === -1) return null;
    bookings[idx] = { ...bookings[idx], ...data };
    saveDemoBookings(eventId, bookings);
    return bookings[idx];
  }

  const docRef = doc(db, 'events', eventId, 'bookings', bookingId);
  await updateDoc(docRef, data);
  return { id: bookingId, ...data };
}

/**
 * Delete a booking
 */
export async function deleteBooking(eventId, bookingId) {
  if (isDemoMode) {
    const bookings = getDemoBookings(eventId);
    const filtered = bookings.filter(b => b.id !== bookingId);
    saveDemoBookings(eventId, filtered);
    return true;
  }

  await deleteDoc(doc(db, 'events', eventId, 'bookings', bookingId));
  return true;
}

/**
 * Log a QR scan for a booking
 */
export async function logQRScan(eventId, boothId, scanData) {
  if (isDemoMode) {
    const bookings = getDemoBookings(eventId);
    const updated = bookings.map(b => {
      if (b.boothId === boothId) {
        const newScanLog = [...(b.scanLog || []), {
          timestamp: new Date().toISOString(),
          event: scanData.event,
          gate: scanData.gate || 'Gate A',
          scannedBy: scanData.scannedBy || 'Unknown',
        }];
        return {
          ...b,
          scanLog: newScanLog,
          status: scanData.event.includes('Check-in') ? 'Checked In' : b.status,
        };
      }
      return b;
    });
    saveDemoBookings(eventId, updated);
    return updated;
  }

  // Firestore: find booking by boothId, update scanLog
  const colRef = collection(db, 'events', eventId, 'bookings');
  const snap = await getDocs(colRef);
  for (const d of snap.docs) {
    const data = d.data();
    if (data.boothId === boothId) {
      const newScanLog = [...(data.scanLog || []), {
        timestamp: new Date().toISOString(),
        event: scanData.event,
        gate: scanData.gate || 'Gate A',
        scannedBy: scanData.scannedBy || 'Unknown',
      }];
      await updateDoc(d.ref, {
        scanLog: newScanLog,
        status: scanData.event.includes('Check-in') ? 'Checked In' : data.status,
      });
      break;
    }
  }

  // Return updated bookings
  return getBookings(eventId);
}

/**
 * Calculate stats from bookings + waitlist
 */
export function calculateStats(bookings, waitlist) {
  const paid = bookings.filter(b => b.status === 'Paid' || b.status === 'Checked In');
  const pending = bookings.filter(b => b.status === 'Pending Approval');
  const checkedIn = bookings.filter(b => b.status === 'Checked In');
  const totalRevenue = paid.reduce((sum, b) => sum + (b.amount || 0), 0);
  const pendingReview = (waitlist || []).filter(w => w.status === 'pending_review');
  const waitlistActive = (waitlist || []).filter(w => w.status === 'pending_review' || w.status === 'approved');

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
