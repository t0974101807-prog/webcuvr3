import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { filterNonAdminPersonnel } from '../utils/personnelFilters';

export interface UserPersonnel {
  id: string | number;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  title?: string;
  [key: string]: any;
}

export function usePersonnel() {
  const [personnel, setPersonnel] = useState<UserPersonnel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (db && (db as any).isMock) {
      console.warn("Skipping personnel listener because database is in mock fallback mode.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserPersonnel[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        const filtered = filterNonAdminPersonnel(list);

        // Sort alphabetically by name
        filtered.sort((a, b) => {
          const nameA = (a.name || a.username || '').toLowerCase();
          const nameB = (b.name || b.username || '').toLowerCase();
          return nameA.localeCompare(nameB, 'vi');
        });

        setPersonnel(filtered);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching personnel:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { personnel, loading, error };
}
