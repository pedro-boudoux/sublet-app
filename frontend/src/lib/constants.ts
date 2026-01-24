// Theme Colors (matching the design)
export const colors = {
  primary: '#0079d6',
  backgroundDark: '#0f1a23',
  backgroundLight: '#f5f7f8',
  glassBg: 'rgba(30, 41, 59, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  acrylicBg: 'rgba(15, 26, 35, 0.65)',
} as const;

// Navigation items
export const NAV_ITEMS = [
  { id: 'discover', label: 'Discover', icon: 'Layers', path: '/' },
  { id: 'saved', label: 'Saved', icon: 'Heart', path: '/saved' },
  { id: 'inbox', label: 'Inbox', icon: 'MessageCircle', path: '/inbox' },
  { id: 'profile', label: 'Profile', icon: 'User', path: '/profile' },
] as const;

// API endpoints
export const API_BASE_URL = '/api';

export const ENDPOINTS = {
  getCandidates: `${API_BASE_URL}/get-candidates`,
  createUser: `${API_BASE_URL}/users`,
  swipes: `${API_BASE_URL}/swipes`,
  matches: `${API_BASE_URL}/matches`,
} as const;
