import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './hooks/useLanguage'
import { AppProvider } from './context/AppContext'
import GlobalAIAssistant from './components/GlobalAIAssistant'
import './index.css'

// --- CAPACITOR MOBILE API AND UPLOAD REDIRECTION INTERCEPTOR ---
if (typeof window !== 'undefined') {
  const isCapacitor = !!(window as any).Capacitor;
  if (isCapacitor) {
    const API_BASE_URL = 'https://ais-pre-kp42ylutq362o2onqg6bi4-202290959271.asia-southeast1.run.app';
    const originalFetch = window.fetch;

    // Helper to recursively rewrite absolute upload paths inside JSON responses
    const rewriteUploads = (obj: any, baseUrl: string): any => {
      if (!obj) return obj;
      if (typeof obj === 'string') {
        if (obj.startsWith('/uploads/')) {
          return `${baseUrl}${obj}`;
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => rewriteUploads(item, baseUrl));
      }
      if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = rewriteUploads(obj[key], baseUrl);
          }
        }
        return newObj;
      }
      return obj;
    };

    window.fetch = async function (input, init) {
      let finalInput = input;
      if (typeof input === 'string') {
        if (input.startsWith('/api') || input.startsWith('/public-ai') || input.startsWith('/uploads')) {
          finalInput = `${API_BASE_URL}${input}`;
        }
      } else if (input instanceof URL) {
        if (input.pathname.startsWith('/api') || input.pathname.startsWith('/public-ai') || input.pathname.startsWith('/uploads')) {
          finalInput = `${API_BASE_URL}${input.pathname}${input.search}`;
        }
      } else if (input && typeof input === 'object' && 'url' in (input as any)) {
        const req = input as any;
        if (req.url.startsWith('/api') || req.url.startsWith('/public-ai') || req.url.startsWith('/uploads')) {
          finalInput = new Request(`${API_BASE_URL}${req.url}`, req);
        }
      }

      const response = await originalFetch(finalInput, init);

      // Intercept .json() and .text() to automatically map relative upload links to absolute production server URLs
      const originalJson = response.json;
      const originalText = response.text;

      response.json = async function () {
        const data = await originalJson.call(response);
        return rewriteUploads(data, API_BASE_URL);
      };

      response.text = async function () {
        const text = await originalText.call(response);
        return text.replace(/"\/uploads\//g, `"${API_BASE_URL}/uploads/`);
      };

      return response;
    };
  }
}
// --- END INTERCEPTOR ---

if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(err => {
      console.error('Service Worker unregistration failed:', err);
    });
  } catch (e) {
    console.warn('Service Worker unregistration not supported or blocked in this environment:', e);
  }
}

// --- FIRESTORE IDLE CONNECTION STREAM ERROR MITIGATION ---
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    // Check if this error is the benign idle connection stream warning from @firebase/firestore
    const isBenignFirestoreIdleStream = args.some((arg) => {
      if (!arg) return false;
      
      // Extract a searchable representation of the argument
      let textToSearch = '';
      if (typeof arg === 'string') {
        textToSearch = arg;
      } else if (arg instanceof Error) {
        textToSearch = arg.message + '\n' + (arg.stack || '');
      } else {
        try {
          // Safely stringify objects to search nested properties
          textToSearch = JSON.stringify(arg);
        } catch {
          textToSearch = String(arg);
        }
      }

      return (
        (textToSearch.includes('@firebase/firestore') || textToSearch.includes('Firestore')) &&
        (textToSearch.includes('Disconnecting idle stream') || textToSearch.includes('Timed out waiting for new targets') || textToSearch.includes('Listen\' stream'))
      );
    });

    if (isBenignFirestoreIdleStream) {
      // Downgrade to console.info because this is expected background keepalive/idle stream closure by the Firebase SDK
      console.info('[Firestore Stream Keepalive Lifecycle Event]:', ...args);
      return;
    }

    originalConsoleError.apply(console, args);
  };
}
// --- END FIRESTORE IDLE CONNECTION STREAM ERROR MITIGATION ---

// --- COMPREHENSIVE ERROR LOGGING SYSTEM ---
const remoteLogUrl = '/api/logs';

const sendLogToRemote = async (logData: any) => {
  try {
    await fetch(remoteLogUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });
  } catch (err) {
    // Fail silently so it doesn't disrupt the frontend experience
  }
};

const handleGlobalError = (message: string, source?: string, lineno?: number, colno?: number, error?: Error) => {
  const logPayload = {
    type: 'unhandled_error',
    message,
    source,
    line: lineno,
    column: colno,
    stack: error?.stack || null,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  console.error('[App Init Error Log]:', logPayload);
  sendLogToRemote(logPayload);
};

if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    handleGlobalError(String(message), source, lineno, colno, error);
    return false; // Let browser handle it as well
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const logPayload = {
      type: 'unhandled_rejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('[App Init Rejection Log]:', logPayload);
    sendLogToRemote(logPayload);
  });

  (window as any).__logAppError = (error: Error, errorInfo?: React.ErrorInfo) => {
    const logPayload = {
      type: 'react_lifecycle_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack || null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('[App React Lifecycle Error Log]:', logPayload);
    sendLogToRemote(logPayload);
  };
}
// --- END COMPREHENSIVE ERROR LOGGING SYSTEM ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
