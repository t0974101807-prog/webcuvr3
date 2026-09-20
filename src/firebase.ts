import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
setLogLevel('silent');

let dbInstance: any;

export function initializeDb() {
  try {
    if (firebaseConfig.firestoreDatabaseId) {
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }
  } catch (error) {
    console.warn("Failed to initialize Firestore with named database ID. Trying default...", error);
    try {
      dbInstance = getFirestore(app);
    } catch (defaultError) {
      console.warn("Firestore is completely unavailable on this project. Creating a fallback prototype instance to prevent app crash.", defaultError);
      // Create an object inheriting from Firestore's prototype to satisfy "instanceof" checks
      dbInstance = Object.create(Firestore.prototype);
      dbInstance.isMock = true;
      Object.defineProperty(dbInstance, 'app', { value: app, writable: true, enumerable: true, configurable: true });
      Object.defineProperty(dbInstance, 'type', { value: 'firestore', writable: true, enumerable: true, configurable: true });
    }
  }
  return dbInstance;
}

// Initial database initialization
initializeDb();

/**
 * Checks if the current Firestore client is terminated, and if so, reinitializes it.
 */
export function checkAndReinitFirestore() {
  if (!dbInstance || dbInstance._terminated === true || dbInstance._isTerminated === true) {
    console.log("[Firestore] Auto-healing: Current client is terminated or inactive. Re-initializing...");
    return initializeDb();
  }
  return dbInstance;
}

// Export db as an auto-healing Proxy
export const db = new Proxy({}, {
  get(target, prop) {
    checkAndReinitFirestore();
    const value = Reflect.get(dbInstance, prop, dbInstance);
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    return value;
  },
  set(target, prop, value) {
    checkAndReinitFirestore();
    return Reflect.set(dbInstance, prop, value, dbInstance);
  },
  has(target, prop) {
    checkAndReinitFirestore();
    return Reflect.has(dbInstance, prop);
  },
  ownKeys() {
    checkAndReinitFirestore();
    return Reflect.ownKeys(dbInstance);
  },
  getOwnPropertyDescriptor(target, prop) {
    checkAndReinitFirestore();
    return Reflect.getOwnPropertyDescriptor(dbInstance, prop);
  },
  getPrototypeOf() {
    checkAndReinitFirestore();
    return Reflect.getPrototypeOf(dbInstance);
  }
}) as any;

export const auth = getAuth(app);


