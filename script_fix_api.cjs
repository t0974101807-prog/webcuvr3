const fs = require('fs');
let c = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const oldApiRegex = /const api = \{[\s\S]*?async upload[\s\S]*?return data;\s*\},\s*\};/m;

const newApi = `const api = {
  async req(endpoint: string, method = "GET", body?: any) {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };
    if (token && token !== "undefined" && token !== "null") {
      headers["Authorization"] = \`Bearer \${token}\`;
    }
    const res = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let textData = await res.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error(\`Failed to parse JSON from \${endpoint}. Status: \${res.status}. Body: \${textData.substring(0, 500)}\`);
      if (res.ok && res.status === 200 && textData.trim() === '') {
        return {}; // Handle empty OK responses gracefully
      }
      throw new Error(\`Invalid response from \${endpoint}\`);
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
      headers["Authorization"] = \`Bearer \${token}\`;
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    let textData = await res.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error(\`Failed to parse JSON from \${endpoint}. Status: \${res.status}. Body: \${textData.substring(0, 500)}\`);
      throw new Error(\`Invalid response from \${endpoint}\`);
    }

    if (!res.ok) throw new Error(data?.error || "Upload Error");
    return data;
  },
};`;

const m = c.match(oldApiRegex);
if (!m) {
  console.log('Could not find API object');
} else {
  c = c.replace(oldApiRegex, newApi);
  fs.writeFileSync('src/components/ERP.tsx', c);
  console.log('Replaced API object successfully');
}
