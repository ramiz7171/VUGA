export const ROUTE_MAP: Record<string, { path: string; pageKey: string }> = {
  dashboard:     { path: '/dashboard',  pageKey: 'dashboard' },
  orders:        { path: '/orders',     pageKey: 'orders' },
  orderTracking: { path: '/tasks',      pageKey: 'orderTracking' },
  inventory:     { path: '/inventory',  pageKey: 'inventory' },
  expenses:      { path: '/expenses',   pageKey: 'expenses' },
  analytics:     { path: '/analytics',  pageKey: 'analytics' },
  users:         { path: '/users',      pageKey: 'users' },
  settings:      { path: '/settings',   pageKey: 'settings' },
};

const PATH_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.values(ROUTE_MAP).map(r => [r.path, r.pageKey])
);

export function getPageKeyFromPath(pathname: string): string {
  return PATH_TO_KEY[pathname] || 'dashboard';
}

export function getPathFromKey(key: string): string {
  return ROUTE_MAP[key]?.path || '/dashboard';
}
