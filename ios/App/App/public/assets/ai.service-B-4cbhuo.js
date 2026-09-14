import{f as s}from"./index-CFvSYNXs.js";async function m(i,o){try{let e=i;const r=[];if(o&&o.length>0)for(const t of o)t.text?e+=`

--- Document: ${t.name||""} ---
${t.text}
--- End Document ---
`:t.data&&t.mimeType&&r.push({mimeType:t.mimeType,data:t.data});const n=await s("/api/ai/ask",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:e,files:r})}),a=await n.json();if(!n.ok)throw new Error(a.error||"Lỗi khi gọi API AI");return a.text||"(Không nhận được phản hồi)"}catch(e){throw console.error("AI Error:",e),new Error(e.message)}}export{m as askAI};
