const fs = require('fs');
let code = fs.readFileSync('src/components/ClientPortal.tsx', 'utf8');

// 1. Add file upload handling
const handleSendMessageStr = `const handleSendMessage = (e: React.FormEvent) => {`;
const fileUploadFunc = `
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await fetch('/api/live-upload', { method: 'POST', body: formData });
      const data = await uploadRes.json();
      if (data.url) {
        socket.emit('send_message', {
          visitorId: portalId,
          senderType: 'visitor',
          content: 'Đã gửi tệp đính kèm: ' + file.name,
          fileUrl: data.url,
          fileName: file.name
        });
      }
    } catch(err) {
      console.error(err);
    }
    if (e.target) e.target.value = '';
  };
  
  `;
code = code.replace(handleSendMessageStr, fileUploadFunc + handleSendMessageStr);

// 2. Add icon imports
const paperclipImport = `import { FileText, Clock, ChevronRight, CheckCircle, Shield, MessageCircle, Send, Paperclip } from 'lucide-react';`;
code = code.replace(`import { FileText, Clock, ChevronRight, CheckCircle, Shield, MessageCircle, Send } from 'lucide-react';`, paperclipImport);

// 3. Render attachments
const renderMessageFunc = `\${msg.content}
                    </div>`;

const renderAttachment = `\${msg.content}
                      {msg.file_url && (
                        <div className="mt-2 p-2 bg-black/5 rounded-lg border border-black/5 flex items-center gap-2">
                          <Paperclip size={16} />
                          <a href={msg.file_url} target="_blank" rel="noreferrer" className="text-xs hover:underline truncate hover:text-blue-200">{msg.file_name || 'Tệp đính kèm'}</a>
                        </div>
                      )}
                    </div>`;
                     
code = code.replace(renderMessageFunc, renderAttachment);

// 4. Add Paperclip button in form
const inputField = `<input
                  type="text"`;
const appendInput = `<label className="cursor-pointer px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0">
                  <Paperclip size={20} />
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <input
                  type="text"`;
code = code.replace(inputField, appendInput);

fs.writeFileSync('src/components/ClientPortal.tsx', code);
