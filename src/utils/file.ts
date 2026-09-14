import fs from "fs";
import path from "path";
// @ts-ignore
import * as pdfParseModule from "pdf-parse";
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const NAS = process.env.NODE_ENV === "production" ? path.join("/tmp", "nas_storage") : path.join(process.cwd(), "nas_storage");
if (!fs.existsSync(NAS)) fs.mkdirSync(NAS, { recursive: true });

export function saveFileToNAS(file: any, caseId: string) {
  const folder = path.join(NAS, caseId);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  const filename = `${Date.now()}_${file.originalname}`;
  const full = path.join(folder, filename);
  fs.writeFileSync(full, file.buffer);
  return { filename, path: full };
}

export async function extractTextFromFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      const data = await pdfParse(fs.readFileSync(filePath));
      return data.text;
    }
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    if (ext === ".xlsx") {
      const wb = XLSX.readFile(filePath);
      let text = "";
      wb.SheetNames.forEach(s => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
        text += JSON.stringify(rows) + "\n";
      });
      return text;
    }
  } catch (e) {
    console.error("Error extracting text:", e);
  }
  return "";
}
