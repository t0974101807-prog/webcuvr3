import{f as s}from"./index-uTE6GmTY.js";import"./vendor-charts-DdrxQYlH.js";import"./vendor-documents-m9TyCPti.js";import"./vendor-firebase-CfWpNo-f.js";async function d(a,o,m){try{let e=a;const r=[];if(o&&o.length>0)for(const t of o)t.text?e+=`

--- Document: ${t.name||""} ---
${t.text}
--- End Document ---
`:t.data&&t.mimeType&&r.push({mimeType:t.mimeType,data:t.data});const n=await s("/api/ai/ask",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:e,files:r,enableSearchGrounding:m})}),i=await n.json();if(!n.ok)throw new Error(i.error||"Lỗi khi gọi API AI");return i.text||"(Không nhận được phản hồi)"}catch(e){throw console.error("AI Error:",e),new Error(e.message)}}export{d as askAI};
