/*
  BAZAAR-OS — Role-Based Access Control v2
  ==========================================
  Three roles:
  - Admin (SHYY / The Grid team): Full system access, settings, AI, all data
  - Organizer (Lydie): Brand management, waitlist, QR, export — no system settings
  - Gate Organizer: QR scanning and floor plan only — for on-the-ground staff
  
  Organizers are stored in localStorage so admins can add new ones from Settings.
*/

export const ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  GATE_ORGANIZER: 'gate_organizer',
};

// ── Default seed credentials ──
const DEFAULT_CREDENTIALS = [
  {
    id: 'admin',
    email: 'admin@thegrid.io',
    password: 'admin123',
    role: ROLES.ADMIN,
    name: 'SHYY Admin',
    avatar: '⚡',
    title: 'System Administrator',
  },
  {
    id: 'organizer',
    email: 'lydia@lamarket.com',
    password: 'lydia123',
    role: ROLES.ORGANIZER,
    name: 'Lydia Akram',
    avatar: '👑',
    title: 'Event Organizer',
  },
];

// ── Persist / Load credentials ──
const STORAGE_KEY = 'bazaar_os_credentials';

function loadCredentials() {
  if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore parse errors
  }
  // First load — seed with defaults
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
  return DEFAULT_CREDENTIALS;
}

function saveCredentials(creds) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

// ── Permission matrix — what each role can do ──
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    canViewOverview: true,
    canManageBrands: true,
    canEditBrand: true,
    canManageWaitlist: true,
    canReviewRequests: true,
    canPromoteWaitlist: true,
    canRejectWaitlist: true,
    canScanQR: true,
    canViewFloorPlan: true,
    canExportData: true,
    canManualReserve: true,
    canUseAI: true,
    canAccessSettings: true,
    canChangePhase: true,
    canViewLogs: true,
    canDeleteBooking: true,
    canManageOrganizers: true,
  },
  [ROLES.ORGANIZER]: {
    canViewOverview: true,
    canManageBrands: true,
    canEditBrand: true,
    canManageWaitlist: true,
    canReviewRequests: true,
    canPromoteWaitlist: true,
    canRejectWaitlist: true,
    canScanQR: true,
    canViewFloorPlan: true,
    canExportData: true,
    canManualReserve: true,
    canUseAI: true,
    canAccessSettings: false,
    canChangePhase: false,
    canViewLogs: true,
    canDeleteBooking: false,
    canManageOrganizers: false,
  },
  [ROLES.GATE_ORGANIZER]: {
    canViewOverview: false,
    canManageBrands: false,
    canEditBrand: false,
    canManageWaitlist: false,
    canReviewRequests: false,
    canPromoteWaitlist: false,
    canRejectWaitlist: false,
    canScanQR: true,
    canViewFloorPlan: true,
    canExportData: false,
    canManualReserve: false,
    canUseAI: false,
    canAccessSettings: false,
    canChangePhase: false,
    canViewLogs: false,
    canDeleteBooking: false,
    canManageOrganizers: false,
  },
};

// ── Authenticate user ──
export function authenticate(email, password) {
  const creds = loadCredentials();
  for (const cred of creds) {
    if (cred.email === email && cred.password === password) {
      return {
        success: true,
        user: {
          id: cred.id,
          email: cred.email,
          role: cred.role,
          name: cred.name,
          avatar: cred.avatar,
          title: cred.title,
          permissions: PERMISSIONS[cred.role],
        },
      };
    }
  }
  return { success: false, error: 'Invalid email or password' };
}

// ── Check if a user has a specific permission ──
export function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;
  return user.permissions[permission] === true;
}

// ── Get all organizers (for Settings panel) ──
export function getOrganizers() {
  return loadCredentials();
}

// ── Add a new organizer ──
export function addOrganizer({ name, email, password, role, avatar, title }) {
  const creds = loadCredentials();
  // Check if email already exists
  if (creds.some(c => c.email === email)) {
    return { success: false, error: 'An organizer with this email already exists' };
  }
  const newOrganizer = {
    id: `org_${Date.now()}`,
    email,
    password,
    role: role || ROLES.ORGANIZER,
    name,
    avatar: avatar || '🎯',
    title: title || (role === ROLES.GATE_ORGANIZER ? 'Gate Organizer' : 'Event Organizer'),
  };
  creds.push(newOrganizer);
  saveCredentials(creds);
  return { success: true, organizer: newOrganizer };
}

// ── Remove an organizer ──
export function removeOrganizer(id) {
  const creds = loadCredentials();
  // Don't allow removing the main admin
  if (id === 'admin') return { success: false, error: 'Cannot remove the system administrator' };
  const filtered = creds.filter(c => c.id !== id);
  if (filtered.length === creds.length) return { success: false, error: 'Organizer not found' };
  saveCredentials(filtered);
  return { success: true };
}

// ── Get sidebar items filtered by role ──
export function getSidebarItems(user) {
  const allItems = [
    { id: 'overview', icon: '📊', label: 'Overview', permission: 'canViewOverview' },
    { id: 'brands', icon: '🏷️', label: 'Brands', permission: 'canManageBrands' },
    { id: 'waitlist', icon: '📋', label: 'Waiting List', permission: 'canManageWaitlist' },
    { id: 'map', icon: '🗺', label: 'Floor Plan', permission: 'canViewFloorPlan' },
    { id: 'qr', icon: '📱', label: 'QR Scanner', permission: 'canScanQR' },
    { id: 'settings', icon: '⚙️', label: 'Settings', permission: 'canAccessSettings' },
  ];

  return allItems.filter(item => hasPermission(user, item.permission));
}

// ── Role display helpers ──
export function getRoleLabel(role) {
  const labels = {
    [ROLES.ADMIN]: 'System Admin',
    [ROLES.ORGANIZER]: 'Organizer',
    [ROLES.GATE_ORGANIZER]: 'Gate Staff',
  };
  return labels[role] || 'Unknown';
}

export const AVATAR_OPTIONS = ['⚡', '👑', '🎯', '🌟', '🔥', '💎', '🎪', '🎨'];
