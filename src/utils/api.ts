import { auth } from "../firebase";

const getSafeFallback = (targetUrl: string): any => {
  if (targetUrl.includes("/permissions")) {
    return {
      manageUsers: false,
      viewAllRecords: false,
      editAllRecords: false,
      deleteRecords: false,
      manageEvents: false,
      manageLegalDocs: false,
      manageFinance: false,
      manageWeb: false,
      viewEventHistory: false,
      viewReports: false,
      viewPersonalRecords: true,
      editPersonalRecords: true,
    };
  }
  if (targetUrl.includes("/me")) {
    return { success: false, user: null };
  }
  if (targetUrl.includes("/unread-chats")) {
    return { unread: 0 };
  }
  if (
    targetUrl.includes("/record-types") ||
    targetUrl.includes("/clients") ||
    targetUrl.includes("/messages") ||
    targetUrl.includes("/services") ||
    targetUrl.includes("/legal-services") ||
    targetUrl.includes("/news") ||
    targetUrl.includes("/recruitment") ||
    targetUrl.includes("/team") ||
    targetUrl.includes("/users") ||
    targetUrl.includes("/live-threads") ||
    targetUrl.includes("/erp-records") ||
    targetUrl.includes("/cases") ||
    targetUrl.includes("/employees") ||
    targetUrl.includes("/monthly-payrolls") ||
    targetUrl.includes("/evaluations") ||
    targetUrl.includes("/legal-forms") ||
    targetUrl.includes("/judgments") ||
    targetUrl.includes("/precedents") ||
    targetUrl.includes("/testimonials")
  ) {
    return [];
  }
  return {};
};

export const fetchApi = async (url: string, options: RequestInit = {}) => {
  let token: string | null = null;
  try {
    token = localStorage.getItem('token');
  } catch (e) {
    console.warn('Local storage disabled or failed:', e);
  }

  // Proactive: Auto-retrieve/refresh token in background via Firebase SDK if authenticated
  if (auth && auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken();
      if (freshToken) {
        token = freshToken;
        try {
          localStorage.setItem('token', freshToken);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[API] Proactive Firebase ID token auto-retrieval failed:', e);
    }
  }
  
  const headers = new Headers();
  
  // Safely import provided options.headers
  if (options.headers) {
    try {
      if (options.headers instanceof Headers) {
        options.headers.forEach((val, key) => {
          try { headers.set(key, val); } catch (e) {}
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, val]) => {
          try { headers.set(key, val); } catch (e) {}
        });
      } else if (typeof options.headers === 'object') {
        Object.entries(options.headers).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            try { headers.set(key, String(val)); } catch (e) {}
          }
        });
      }
    } catch (hErr) {
      console.warn('[API] Error copying headers:', hErr);
    }
  }

  // Sanitize token before setting Authorization header to prevent 'The string did not match the expected pattern'
  if (token && typeof token === 'string') {
    const cleanToken = token.trim();
    if (cleanToken && cleanToken !== 'undefined' && cleanToken !== 'null' && /^[\x20-\x7E]+$/.test(cleanToken)) {
      try {
        headers.set('Authorization', `Bearer ${cleanToken}`);
      } catch (authHeaderErr) {
        console.warn('[API] Failed to set Authorization header:', authHeaderErr);
      }
    }
  }

  // Prevent aggressive browser caching for all API calls
  try {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json, text/plain, */*');
    }
  } catch (e) {}

  // Prevent Service Worker / Browser bugs by appending a cache buster
  const separator = url.includes('?') ? '&' : '?';
  const cacheBustedUrl = `${url}${separator}_cb=${Date.now()}`;

  let response: Response;
  try {
    response = await fetch(cacheBustedUrl, {
      ...options,
      headers,
    });
  } catch (err) {
    console.warn(`[API] Native fetch failed for ${url}:`, err);
    const fallbackData = getSafeFallback(url);
    return {
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers(),
      url: url,
      text: async () => "",
      json: async () => fallbackData,
    } as unknown as Response;
  }

  if (response.status === 401) {
    // Reactive: If 401 occurs and Firebase user is present, force-refresh the ID token and retry once
    if (auth && auth.currentUser) {
      console.log('[API] 401 Unauthorized detected. Attempting to force-refresh Firebase ID token...');
      try {
        const forcedToken = await auth.currentUser.getIdToken(true);
        if (forcedToken) {
          try {
            localStorage.setItem('token', forcedToken);
          } catch (e) {}
          
          headers.set('Authorization', `Bearer ${forcedToken}`);
          console.log('[API] Retrying original request with forced Firebase ID token...');
          try {
            const retryResponse = await fetch(cacheBustedUrl, {
              ...options,
              headers,
            });
            if (retryResponse.ok || retryResponse.status !== 401) {
              response = retryResponse;
            } else {
              // Retry returned 401 again, proceed to reset/logout
              localStorage.removeItem('token');
            }
          } catch (retryErr) {
            console.error('[API] Retry request failed after token refresh:', retryErr);
            localStorage.removeItem('token');
          }
        } else {
          localStorage.removeItem('token');
        }
      } catch (refreshErr) {
        console.error('[API] Force-refresh of Firebase ID token failed:', refreshErr);
        try {
          localStorage.removeItem('token');
        } catch (e) {}
      }
    } else {
      // No Firebase user, immediately handle unauthorized
      try {
        localStorage.removeItem('token');
      } catch (e) {
        console.warn('Local storage disabled or failed:', e);
      }
    }
  }

  // Intercept and patch response body reading to be extremely robust against HTML / rate limits
  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch (e) {
    console.warn("Failed to read response body:", e);
  }

  Object.defineProperty(response, "text", {
    value: async () => bodyText,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(response, "json", {
    value: async () => {
      if (response.status === 429) {
        console.warn(`[API] 429 Rate limit hit on ${url}. Returning safe fallback.`);
        return getSafeFallback(url);
      }
      const trimmed = bodyText.trim();
      if (
        trimmed.startsWith("<!DOCTYPE") ||
        trimmed.startsWith("<!doctype") ||
        trimmed.startsWith("<html") ||
        trimmed.includes("Starting Server...")
      ) {
        console.warn(`[API] Intercepted HTML response from ${url}. Returning safe fallback.`);
        return getSafeFallback(url);
      }
      try {
        return JSON.parse(bodyText);
      } catch (err) {
        console.warn(`[API] JSON parse error for ${url}:`, err);
        return getSafeFallback(url);
      }
    },
    writable: true,
    configurable: true,
  });

  return response;
};

export const navigateTo = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

