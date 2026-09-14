import{f as p}from"./index-BoLD5kpA.js";import"./vendor-DAPB0RRM.js";import"./vendor-motion-CVrZCC5S.js";import"./vendor-icons-CgLG_Y1v.js";import"./vendor-maps-D715bF5I.js";import"./vendor-charts-BNyPnY5B.js";import"./vendor-docs-YTGZtuZ3.js";import"./vendor-firebase-Daa4VRod.js";async function w(a,r,m){try{let o=a;const e=[];if(r&&r.length>0)for(const t of r)t.text?o+=`

--- Document: ${t.name||""} ---
${t.text}
--- End Document ---
`:t.data&&t.mimeType&&e.push({mimeType:t.mimeType,data:t.data});const i=await p("/api/ai/ask",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:o,files:e,enableSearchGrounding:m})}),n=await i.json();if(!i.ok)throw new Error(n.error||"Lỗi khi gọi API AI");return n.text||"(Không nhận được phản hồi)"}catch(o){throw console.error("AI Error:",o),new Error(o.message)}}export{w as askAI};
