import { fetchApi } from "../utils/api";

export async function askAI(
  prompt: string,
  files?: { mimeType?: string; data?: string; text?: string; name?: string }[],
  enableSearchGrounding?: boolean
) {
  try {
    let finalPrompt = prompt;
    const formattedFiles: any[] = [];
    
    if (files && files.length > 0) {
      for (const f of files) {
        if (f.text) {
          finalPrompt += `\n\n--- Document: ${f.name || ''} ---\n${f.text}\n--- End Document ---\n`;
        } else if (f.data && f.mimeType) {
          formattedFiles.push({ mimeType: f.mimeType, data: f.data });
        }
      }
    }

    const res = await fetchApi("/api/ai/ask", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        files: formattedFiles,
        enableSearchGrounding: enableSearchGrounding
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Lỗi khi gọi API AI");
    }

    return data.text || "(Không nhận được phản hồi)";
  } catch (e: any) {
    console.error("AI Error:", e);
    throw new Error(e.message);
  }
}
