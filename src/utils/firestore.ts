import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db, checkAndReinitFirestore } from '../firebase';

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
    const officesSnapshot = await getDocs(collection(db, 'offices'));
    const branchesList: OfficeBranch[] = [];
    
    officesSnapshot.forEach((doc) => {
      const data = doc.data();
      branchesList.push({
        id: doc.id,
        name: data.name || '',
        ...data,
      });
    });

    if (branchesList.length > 0) {
      return branchesList.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    // Try 'branches' collection as fallback
    const branchesSnapshot = await getDocs(collection(db, 'branches'));
    branchesSnapshot.forEach((doc) => {
      const data = doc.data();
      branchesList.push({
        id: doc.id,
        name: data.name || '',
        ...data,
      });
    });

    return branchesList.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error: any) {
    console.error('Error fetching branches in fetchBranches:', error);
    
    // If the client has already been terminated, reinitialize and retry once
    if (error && error.message && (
      error.message.includes('terminated') || 
      error.message.includes('client has already been terminated')
    )) {
      console.log('[Firestore] fetchBranches: Terminated client detected. Auto-healing and retrying...');
      try {
        checkAndReinitFirestore();
        
        const officesSnapshot = await getDocs(collection(db, 'offices'));
        const branchesList: OfficeBranch[] = [];
        
        officesSnapshot.forEach((doc) => {
          const data = doc.data();
          branchesList.push({
            id: doc.id,
            name: data.name || '',
            ...data,
          });
        });

        if (branchesList.length > 0) {
          return branchesList.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        }

        const branchesSnapshot = await getDocs(collection(db, 'branches'));
        branchesSnapshot.forEach((doc) => {
          const data = doc.data();
          branchesList.push({
            id: doc.id,
            name: data.name || '',
            ...data,
          });
        });

        return branchesList.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      } catch (retryError: any) {
        console.error('[Firestore] Retry fetchBranches failed:', retryError.message);
      }
    }
    
    return [];
  }
}

/**
 * Real-time subscription to branches
 */
export function subscribeToBranches(callback: (branches: OfficeBranch[]) => void) {
  return onSnapshot(
    collection(db, 'offices'),
    (snapshot) => {
      const list: OfficeBranch[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          name: data.name || '',
          ...data,
        });
      });
      callback(list.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
    },
    (error) => {
      console.error('Error in subscribeToBranches:', error);
    }
  );
}
