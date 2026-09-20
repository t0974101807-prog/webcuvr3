export const api = {
  async req(endpoint: string, method = "GET", body?: any) {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };
    if (token && token !== "undefined" && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    headers["Accept"] = "application/json";

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
        targetUrl.includes("/recycle-bin") ||
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

    const separator = endpoint.includes('?') ? '&' : '?';
    const finalEndpoint = `${endpoint}${separator}_cb=${Date.now()}`;

    let res: Response;
    try {
      res = await fetch(finalEndpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      console.warn(`[ERP API] Native fetch failed for ${endpoint}:`, err);
      return getSafeFallback(endpoint);
    }

    if (res.status === 429) {
      console.warn(`[ERP API] 429 Rate limit hit on ${endpoint}. Returning safe fallback.`);
      return getSafeFallback(endpoint);
    }

    const textData = await res.text();
    const trimmed = textData.trim();
    if (
      trimmed.startsWith("<!DOCTYPE") ||
      trimmed.startsWith("<!doctype") ||
      trimmed.startsWith("<html") ||
      trimmed.includes("Starting Server...")
    ) {
      console.warn(`[ERP API] Intercepted HTML response from ${endpoint}. Returning safe fallback.`);
      return getSafeFallback(endpoint);
    }

    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error(`Failed to parse JSON from ${endpoint}. Status: ${res.status}. Body: ${textData.substring(0, 500)}`);
      if (res.ok && res.status === 200 && trimmed === '') {
        return {};
      }
      return getSafeFallback(endpoint);
    }

    if (!res.ok) throw new Error(data?.error || "API Error");
    return data;
  },

  async upload(endpoint: string, formData: FormData) {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };
    if (token && token !== "undefined" && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`;
    }
    headers["Accept"] = "application/json";

    const separator = endpoint.includes('?') ? '&' : '?';
    const finalEndpoint = `${endpoint}${separator}_cb=${Date.now()}`;
    const res = await fetch(finalEndpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    const textData = await res.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error(`Failed to parse JSON from ${endpoint}. Status: ${res.status}. Body: ${textData.substring(0, 500)}`);
      throw new Error(`Invalid response from ${endpoint}`);
    }

    if (!res.ok) throw new Error(data?.error || "Upload Error");
    return data;
  },
};
