import { doc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
export { db, auth };

// Validate Connection to Firestore as per Firebase skill constraints
async function testConnection() {
  if (typeof window === 'undefined') {
    // Skip testing connection on the server-side where outbound connections are restricted
    return;
  }
  if (db && (db as any).isMock) {
    console.warn("Skipping Firestore connection test since database is in mock fallback mode.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('offline'))) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Only throw the hard error for Missing or Insufficient Permissions to assist with rules debugging.
  // This prevents non-permission exceptions (such as Quota Exceeded or Network limits) from crashing the React application.
  const errMsg = errInfo.error.toLowerCase();
  if (errMsg.includes('permission') || errMsg.includes('insufficient')) {
    throw new Error(JSON.stringify(errInfo));
  }
}
