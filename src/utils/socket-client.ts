import { io as originalIo } from '../../node_modules/socket.io-client/dist/socket.io.esm.min.js';
export * from '../../node_modules/socket.io-client/dist/socket.io.esm.min.js';

const API_BASE_URL = 'https://ais-pre-kp42ylutq362o2onqg6bi4-202290959271.asia-southeast1.run.app';

export const io = (url?: any, options?: any) => {
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
  
  if (isCapacitor) {
    if (!url || typeof url !== 'string') {
      if (url && typeof url === 'object') {
        options = url;
      }
      url = API_BASE_URL;
    } else if (url.startsWith('/')) {
      url = `${API_BASE_URL}${url}`;
    }
  }
  
  return originalIo(url, options);
};
