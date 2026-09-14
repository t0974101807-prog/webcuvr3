import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

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
        
        // Filter out admin accounts as per user request (role or email contains 'admin')
        const filtered = list.filter((u) => {
          const role = (u.role || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const username = (u.username || '').toLowerCase();
          const title = (u.title || '').toLowerCase();
          
          const isAdmin = 
            role === 'admin' || 
            email === 'admin' || 
            email.includes('admin') ||
            username === 'admin' ||
            title.includes('quản trị') ||
            title.includes('admin');
            
          return !isAdmin;
        });

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
