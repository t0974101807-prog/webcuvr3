import { fetchApi } from './api';

export interface OfficeBranch {
  id: string | number;
  name: string;
  [key: string]: any;
}

/**
 * Fetches the list of office branches from Firestore.
 * Queries the primary 'offices' collection first, and falls back to 'branches' collection if empty.
 */
export async function fetchBranches(): Promise<OfficeBranch[]> {
  try {
    const response = await fetchApi('/api/offices');
    const data = await response.json();
    return Array.isArray(data)
      ? data.sort((a: OfficeBranch, b: OfficeBranch) => a.name.localeCompare(b.name, 'vi'))
      : [];
  } catch (error: any) {
    console.error('Error fetching branches in fetchBranches:', error);
    return [];
  }
}

/**
 * Real-time subscription to branches
 */
export function subscribeToBranches(callback: (branches: OfficeBranch[]) => void) {
  let active = true;
  const load = () => {
    fetchBranches().then((branches) => {
      if (active) callback(branches);
    });
  };
  load();
  const interval = window.setInterval(load, 30000);
  return () => {
    active = false;
    window.clearInterval(interval);
  };
}
