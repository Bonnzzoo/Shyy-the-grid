/*
  BAZAAR-OS — Event Service
  ==========================
  Firestore CRUD for events & organizers.
  Falls back to localStorage demo data when Firebase is not configured.
*/

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db, isDemoMode } from './firebase';

// ── Collection References ──
const EVENTS_COL = 'events';
const ORGANIZERS_COL = 'organizers';

// ══════════════════════════════════════════════════
// DEMO MODE — localStorage fallback data
// ══════════════════════════════════════════════════

const DEMO_STORAGE_KEY = 'bazaar_os_events';

function getDemoEvents() {
  if (typeof window === 'undefined') return [getDefaultLydiaEvent()];
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  const defaults = [getDefaultLydiaEvent()];
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveDemoEvents(events) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(events));
}

export function getDefaultLydiaEvent() {
  return {
    id: 'lydia-demo',
    slug: 'lydia-demo',
    organizerId: 'org_lydia',

    // Branding
    name: 'Summer Breeze',
    edition: '2nd Edition',
    tagline: 'The Modest Market',
    brandAccent: '#8B5E3C',
    brandAccentLight: '#F6F0EB',
    logoUrl: '/lydie-logo.png',

    // Organizer info
    organizer: 'L.A Market',
    organizerInsta: '@lydiaakrammarket',

    // Event Details
    date: 'July 3 – 4, 2026',
    time: '11:00 AM — 10:00 PM',
    location: 'Hall 1, Egypt International Exhibition Center',
    locationShort: 'New Cairo',
    description: "You didn't think we were done, did you? Summer Breeze 2nd Edition is officially happening this July. Expect something bigger, better and more local than ever.",

    // Booth Configuration
    totalBooths: 264,
    soldBooths: 237,
    zones: {
      fashion_icon: { label: 'Fashion Icons', color: '#2A2A2A', priceEGP: 25000, dimensions: '3×3m' },
      beauty_icon: { label: 'Beauty Icons', color: '#444444', priceEGP: 18000, dimensions: '3×2m' },
      sponsor: { label: 'Sponsor Partner', color: '#C8A96E', priceEGP: 75000, dimensions: '4×4m' },
      standard_left: { label: 'Standard', color: '#4A7C59', priceEGP: 4000, dimensions: '2×2m' },
      standard_right: { label: 'Standard', color: '#4A7C59', priceEGP: 4000, dimensions: '2×2m' },
      yellow_zone: { label: 'Premium Standard', color: '#C8A96E', priceEGP: 6500, dimensions: '3×2m' },
    },

    // Floor Plan — Premium Icons
    fashionIcons: [
      { id: 'C1', brand: 'Double Anne Black', logo: 'Double Anne.png', status: 'sold' },
      { id: 'C2', brand: 'Jamila', logo: 'Jamila.png', status: 'sold' },
      { id: 'C3', brand: 'Jude', logo: 'Jude.png', status: 'sold' },
      { id: 'C4', brand: 'Madad', logo: 'Madad.png', status: 'sold' },
      { id: 'C5', brand: 'Maison Taj', logo: 'Maison Tajj.png', status: 'sold' },
      { id: 'C6', brand: 'OBI', logo: 'OBI.png', status: 'sold' },
      { id: 'C7', brand: 'Saba', logo: 'Saba.png', status: 'sold' },
      { id: 'C8', brand: 'TGS', logo: 'TGS.png', status: 'sold' },
      { id: 'C9', brand: 'Taj Sisters', logo: 'Taj Sisters.png', status: 'sold' },
      { id: 'C10', brand: 'Tamaa', logo: 'Tamaa.png', status: 'sold' },
      { id: 'C11', brand: 'FABULICIOUS', status: 'sold' },
      { id: 'C12', brand: 'HOOR DESIGNS', status: 'sold' },
      { id: 'C13', brand: 'MOONLIGHT', status: 'pending' },
      { id: 'C14', brand: 'ZWIENA', status: 'sold' },
    ],
    beautyIcons: [
      { id: 'A1', brand: 'BEINJI', status: 'sold' }, { id: 'A2', brand: 'JOIE BY MIRA', status: 'sold' },
      { id: 'A3', brand: 'KYLA', status: 'sold' }, { id: 'A4', brand: 'MEEM STORE', status: 'sold' },
      { id: 'A5', brand: 'MIKA', status: 'sold' }, { id: 'A6', brand: 'NATURAL', status: 'sold' },
      { id: 'A7', brand: 'OJUY', status: 'sold' }, { id: 'A8', brand: 'ROSETTA V.', status: 'sold' },
      { id: 'A9', brand: 'SHEA BODY', status: 'sold' }, { id: 'A10', brand: 'TON ODEUR', status: 'sold' },
      { id: 'A11', brand: 'ZK HERBAL', status: 'sold' }, { id: 'A12', brand: 'MUSC', status: 'sold' },
      { id: 'A13', brand: 'NOURNIOS', status: 'sold' }, { id: 'A14', brand: 'SHAGHAF', status: 'sold' },
      { id: 'A15', brand: 'AMICI', status: 'sold' }, { id: 'A16', brand: 'BUFANDA', status: 'sold' },
      { id: 'A17', brand: 'TASNEEM', status: 'sold' },
    ],
    sideIcons: [
      { id: 'B1', brand: 'FARAH DESIGNS', status: 'sold' }, { id: 'B2', brand: 'STITCH', status: 'sold' },
      { id: 'B3', brand: 'ASH DECOR', status: 'sold' }, { id: 'D1', brand: 'FARIDA CERAMICS', status: 'sold' },
      { id: 'D2', brand: 'KILIM FARHA', status: 'sold' }, { id: 'D3', brand: 'CHUMMY', status: 'sold' },
      { id: 'D4', brand: 'FEMME', status: 'sold' }, { id: 'D5', brand: 'MUMUU', status: 'sold' },
    ],

    // Floor Plan — Grid layout config
    floorPlan: {
      rowB5: { blocks: [
        { prefix: '', start: 126, count: 7, zone: 'standard_left' },
        { prefix: '', start: 133, count: 6, zone: 'yellow_zone' },
        { prefix: '', start: 139, count: 6, zone: 'yellow_zone' },
        { prefix: '', start: 145, count: 7, zone: 'standard_right' },
      ]},
      rowB4: { blocks: [
        { prefix: '', start: 240, count: 12, zone: 'standard_left' },
        { prefix: '', start: 230, count: 10, zone: 'yellow_zone' },
        { prefix: '', start: 221, count: 9, zone: 'yellow_zone' },
        { prefix: '', start: 215, count: 6, zone: 'standard_right' },
      ]},
      rowB3: { blocks: [
        { prefix: '', start: 178, count: 12, zone: 'standard_left' },
        { prefix: '', start: 168, count: 10, zone: 'yellow_zone' },
        { prefix: '', start: 159, count: 9, zone: 'yellow_zone' },
        { prefix: '', start: 153, count: 6, zone: 'standard_right' },
      ]},
      rowB2: { blocks: [
        { prefix: '', start: 120, count: 12, zone: 'standard_left' },
        { prefix: '', start: 113, count: 6, zone: 'yellow_zone' },
        { prefix: '', start: 107, count: 6, zone: 'yellow_zone' },
        { prefix: '', start: 101, count: 6, zone: 'standard_right' },
      ]},
      rowB1: { blocks: [
        { prefix: '', start: 76, count: 8, zone: 'standard_left' },
        { prefix: '', start: 69, count: 7, zone: 'yellow_zone' },
        { prefix: '', start: 63, count: 6, zone: 'yellow_zone' },
        { prefix: '', start: 59, count: 4, zone: 'standard_right' },
      ]},
      rowA: { prefix: 'A', start: 1, count: 21, zone: 'standard_left', reverse: true },
      foodArea: {
        rows: [
          { prefix: 'F', start: 1, count: 8, zone: 'standard_left' },
          { prefix: 'F', start: 9, count: 8, zone: 'standard_right' },
        ],
      },
    },

    // Phase
    currentPhase: 'priority_booking',
    priorityDeadline: '2026-06-23T23:59:59',

    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ══════════════════════════════════════════════════
// PUBLIC API — Works in both Firestore & Demo mode
// ══════════════════════════════════════════════════

/**
 * Get event by its URL slug — used by public pages (/b/[slug])
 */
export async function getEventBySlug(slug) {
  if (isDemoMode) {
    const events = getDemoEvents();
    return events.find(e => e.slug === slug || e.id === slug) || (slug === 'lydia-demo' || slug === 'summer-breeze-2' ? events[0] : null);
  }

  const q = query(collection(db, EVENTS_COL), where('slug', '==', slug), where('status', '==', 'published'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * Get event by ID — used by admin panel
 */
export async function getEventById(eventId) {
  if (isDemoMode) {
    const events = getDemoEvents();
    return events.find(e => e.id === eventId) || null;
  }

  const docRef = doc(db, EVENTS_COL, eventId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get all events for a given organizer
 */
export async function getEventsByOrganizer(organizerId) {
  if (isDemoMode) {
    const events = getDemoEvents();
    return events.filter(e => e.organizerId === organizerId);
  }

  const q = query(collection(db, EVENTS_COL), where('organizerId', '==', organizerId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get ALL events (for admin super-user)
 */
export async function getAllEvents() {
  if (isDemoMode) {
    return getDemoEvents();
  }

  const q = query(collection(db, EVENTS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Create a new event
 */
export async function createEvent(data) {
  const eventId = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const eventData = {
    ...data,
    id: eventId,
    slug: eventId,
    currentPhase: 'priority_booking',
    status: data.status || 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isDemoMode) {
    const events = getDemoEvents();
    events.push(eventData);
    saveDemoEvents(events);
    return eventData;
  }

  await setDoc(doc(db, EVENTS_COL, eventId), {
    ...eventData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return eventData;
}

/**
 * Update event settings
 */
export async function updateEvent(eventId, data) {
  if (isDemoMode) {
    const events = getDemoEvents();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...data, updatedAt: new Date().toISOString() };
    saveDemoEvents(events);
    // Broadcast to other tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: JSON.stringify(events) }));
    }
    return events[idx];
  }

  const docRef = doc(db, EVENTS_COL, eventId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  return { id: eventId, ...data };
}

/**
 * Update event phase (convenience wrapper)
 */
export async function updateEventPhase(eventId, phase) {
  return updateEvent(eventId, { currentPhase: phase });
}

/**
 * Subscribe to real-time event changes
 */
export function subscribeToEvent(eventId, callback) {
  if (isDemoMode) {
    // In demo mode, listen for storage events
    const handler = (e) => {
      if (e.key === DEMO_STORAGE_KEY) {
        const events = JSON.parse(e.newValue || '[]');
        const event = events.find(ev => ev.id === eventId);
        if (event) callback(event);
      }
    };
    if (typeof window !== 'undefined') {
      // Initial call
      const events = getDemoEvents();
      const event = events.find(ev => ev.id === eventId);
      if (event) callback(event);
      window.addEventListener('storage', handler);
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('storage', handler);
    };
  }

  const docRef = doc(db, EVENTS_COL, eventId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}
