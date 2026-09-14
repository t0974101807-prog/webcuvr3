export function encodeCursor(obj: any): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeCursor(str: string): any {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
}
