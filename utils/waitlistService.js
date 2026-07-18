/*
  BAZAAR-OS — Waitlist Service
  ==============================
  Firestore CRUD for waitlist / applications (per-event subcollection).
  Falls back to localStorage demo data when Firebase is not configured.
*/

import {
  collection, doc, getDocs, setDoc, updateDoc,
  query, orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db, isDemoMode } from './firebase';

// ── Demo Mode Storage ──
const DEMO_WAITLIST_PREFIX = 'bazaar_os_waitlist_';

function getDemoWaitlist(eventId) {
  if (typeof window === 'undefined') return createDefaultWaitlist();
  try {
    // Legacy key support (for existing data)
    const legacyStored = localStorage.getItem('bazaar_os_waitlist');
    const stored = localStorage.getItem(DEMO_WAITLIST_PREFIX + eventId) || legacyStored;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  const defaults = createDefaultWaitlist();
  localStorage.setItem(DEMO_WAITLIST_PREFIX + eventId, JSON.stringify(defaults));
  return defaults;
}

function saveDemoWaitlist(eventId, waitlist) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_WAITLIST_PREFIX + eventId, JSON.stringify(waitlist));
  // Also update legacy key for backward compatibility
  localStorage.setItem('bazaar_os_waitlist', JSON.stringify(waitlist));
  window.dispatchEvent(new StorageEvent('storage', {
    key: DEMO_WAITLIST_PREFIX + eventId,
    newValue: JSON.stringify(waitlist),
  }));
  // Legacy event for old code
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'bazaar_os_waitlist',
    newValue: JSON.stringify(waitlist),
  }));
}

function createDefaultWaitlist() {
  return [
    {
      id: 'WL001', brand: 'Nora Accessories', category: 'Accessories',
      phone: '+20 100 222 3333', instagram: '@noraacc', email: 'nora@email.com',
      taxCardUploaded: true, taxCardImage: null,
      preferredZone: 'standard_left', dateJoined: '2026-06-15T10:00:00',
      position: 1, status: 'pending_review',
      requestMessage: 'We were part of the last season and would love to return!',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL002', brand: 'Linen & Co.', category: 'Fashion Icons',
      phone: '+20 111 444 5555', instagram: '@linenco', email: 'linen@email.com',
      taxCardUploaded: true, taxCardImage: null,
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
      taxCardUploaded: true, taxCardImage: null,
      preferredZone: 'beauty_icon', dateJoined: '2026-06-16T11:15:00',
      position: 4, status: 'pending_review',
      requestMessage: '',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
    {
      id: 'WL006', brand: 'Fresh Bakes', category: 'Natural Blends',
      phone: '+20 111 030 4040', instagram: '@freshbakes', email: 'fresh@email.com',
      taxCardUploaded: true, taxCardImage: null,
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
      taxCardUploaded: true, taxCardImage: null,
      preferredZone: 'standard_left', dateJoined: '2026-06-17T15:30:00',
      position: 8, status: 'pending_review',
      requestMessage: 'Handmade pottery and ceramics. We were recommended by Nora Accessories.',
      reviewedAt: null, reviewedBy: null, rejectionReason: null,
    },
  ];
}

// ══════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════

/**
 * Get all waitlist entries for an event
 */
export async function getWaitlist(eventId) {
  if (isDemoMode) {
    return getDemoWaitlist(eventId);
  }

  const colRef = collection(db, 'events', eventId, 'waitlist');
  const q = query(colRef, orderBy('position', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to real-time waitlist changes
 */
export function subscribeToWaitlist(eventId, callback) {
  if (isDemoMode) {
    const handler = (e) => {
      if (e.key === DEMO_WAITLIST_PREFIX + eventId || e.key === 'bazaar_os_waitlist') {
        callback(JSON.parse(e.newValue || '[]'));
      }
    };
    if (typeof window !== 'undefined') {
      callback(getDemoWaitlist(eventId));
      window.addEventListener('storage', handler);
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
    };
  }

  const colRef = collection(db, 'events', eventId, 'waitlist');
  const q = query(colRef, orderBy('position', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Add a brand application to the waitlist
 */
export async function addToWaitlist(eventId, application) {
  const waitlist = isDemoMode ? getDemoWaitlist(eventId) : await getWaitlist(eventId);

  const newApp = {
    id: `WL${Date.now()}`,
    ...application,
    dateJoined: new Date().toISOString(),
    position: waitlist.length + 1,
    status: 'pending_review',
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  if (isDemoMode) {
    waitlist.push(newApp);
    saveDemoWaitlist(eventId, waitlist);
    return newApp;
  }

  await setDoc(doc(db, 'events', eventId, 'waitlist', newApp.id), {
    ...newApp,
    createdAt: serverTimestamp(),
  });
  return newApp;
}

/**
 * Approve a waitlist request
 */
export async function approveRequest(eventId, requestId, reviewerName) {
  if (isDemoMode) {
    const waitlist = getDemoWaitlist(eventId);
    const updated = waitlist.map(w =>
      w.id === requestId
        ? { ...w, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: reviewerName }
        : w
    );
    saveDemoWaitlist(eventId, updated);
    return updated;
  }

  const docRef = doc(db, 'events', eventId, 'waitlist', requestId);
  await updateDoc(docRef, {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerName,
  });
  return getWaitlist(eventId);
}

/**
 * Reject a waitlist request
 */
export async function rejectRequest(eventId, requestId, reviewerName, reason) {
  if (isDemoMode) {
    const waitlist = getDemoWaitlist(eventId);
    const updated = waitlist.map(w =>
      w.id === requestId
        ? { ...w, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: reviewerName, rejectionReason: reason }
        : w
    );
    saveDemoWaitlist(eventId, updated);
    return updated;
  }

  const docRef = doc(db, 'events', eventId, 'waitlist', requestId);
  await updateDoc(docRef, {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerName,
    rejectionReason: reason,
  });
  return getWaitlist(eventId);
}

/**
 * Promote a waitlist brand to a booking
 */
export async function promoteFromWaitlist(eventId, requestId, boothId, boothPrice) {
  if (isDemoMode) {
    const waitlist = getDemoWaitlist(eventId);
    const updated = waitlist.map(w =>
      w.id === requestId
        ? { ...w, status: 'promoted', promotedTo: boothId }
        : w
    );
    // Reindex positions
    let pos = 1;
    const reindexed = updated.map(w => {
      if (w.status === 'pending_review' || w.status === 'approved') {
        return { ...w, position: pos++ };
      }
      return w;
    });
    saveDemoWaitlist(eventId, reindexed);
    return reindexed;
  }

  const docRef = doc(db, 'events', eventId, 'waitlist', requestId);
  await updateDoc(docRef, {
    status: 'promoted',
    promotedTo: boothId,
  });
  return getWaitlist(eventId);
}
