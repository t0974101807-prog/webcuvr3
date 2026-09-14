import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// I will patch the Messages Tab entirely.
const fetchMsgSearch = `      // Fetch messages and stats
      try {
        const msgsRes = await fetchApi(\`/api/messages?t=\${t}\`);
        if (msgsRes.ok) setMessages(await msgsRes.json());
        const statsRes = await fetchApi(\`/api/stats?t=\${t}\`);
        if (statsRes.ok) setStats(await statsRes.json());
      } catch(e) {}`;

const fetchMsgReplace = `      // Fetch messages and stats
      try {
        const msgsRes = await fetchApi(\`/api/live-threads?t=\${t}\`);
        if (msgsRes.ok) setMessages(await msgsRes.json());
        const statsRes = await fetchApi(\`/api/stats?t=\${t}\`);
        if (statsRes.ok) setStats(await statsRes.json());
      } catch(e) {}`;
      
content = content.replace(fetchMsgSearch, fetchMsgReplace);


// Setup active visitor state and socket logic for admin
const stateSearch = `  const [stats, setStats] = useState<any>({ chartData: [], summary: { totalMessages: 0, unreadMessages: 0 } });`;
const stateReplace = `  const [stats, setStats] = useState<any>({ chartData: [], summary: { totalMessages: 0, unreadMessages: 0 } });
  const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
  const [visitorMessages, setVisitorMessages] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [adminSocket, setAdminSocket] = useState<any>(null);
  const visitorEndRef = React.useRef<HTMLDivElement>(null);
  const adminFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingObj, setIsUploadingObj] = useState(false);
`;
content = content.replace(stateSearch, stateReplace);


const socketEffectSearch = `  useEffect(() => {
    fetchData();
    if (user) {`;
const socketEffectReplace = `  useEffect(() => {
    fetchData();
    
    // Connect Admin socket
    try {
      // @ts-ignore
      const socketIo = window.io;
      if (socketIo) {
        const s = socketIo();
        setAdminSocket(s);
        s.on('connect', () => s.emit('join_admin'));
        s.on('receive_message', (msg: any) => {
          // If it's a new message, refresh thread list
          fetchData();
          setVisitorMessages(prev => {
            const exists = prev.find(m => m.created_at === msg.created_at && m.content === msg.content);
            if (exists) return prev;
            return [...prev, msg];
          });
        });
        s.on('messages_read', () => fetchData());
        return () => s.disconnect();
      }
    } catch(e) {}
    
    if (user) {`;
content = content.replace(socketEffectSearch, socketEffectReplace);

// Function to fetch thread messages
const fetchThreadFuncSearch = `  const fetchData = async () => {`;
const fetchThreadFuncReplace = `
  const fetchThreadMessages = async (vid: string) => {
     try {
       const res = await fetchApi(\`/api/live-messages/\${vid}\`);
       if (res.ok) {
         setVisitorMessages(await res.json());
       }
     } catch(e) {}
  };

  useEffect(() => {
    if (activeVisitorId) {
      fetchThreadMessages(activeVisitorId);
      visitorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeVisitorId]);

  useEffect(() => {
    if (visitorMessages.length > 0) {
      visitorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visitorMessages]);

  const sendAdminMessage = () => {
    if ((!adminInput.trim() && !adminFileInputRef.current?.files?.[0]) || !adminSocket || !activeVisitorId) return;
    
    const msg = {
      visitorId: activeVisitorId,
      senderType: 'admin',
      content: adminInput
    };
    adminSocket.emit('send_message', msg);
    setAdminInput('');
  };

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminSocket || !activeVisitorId) return;
    
    setIsUploadingObj(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetchApi('/api/live-upload', { method: 'POST', body: formData });
      const data = await res.json();
      adminSocket.emit('send_message', {
        visitorId: activeVisitorId, senderType: 'admin', content: '', fileUrl: data.url, fileName: data.name
      });
    } catch(err) {
      alert("Lỗi tải file");
    } finally {
      setIsUploadingObj(false);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    }
  };

  const fetchData = async () => {`;
content = content.replace(fetchThreadFuncSearch, fetchThreadFuncReplace);

// Replace Messages Tab View
// I will find the block using regex or split.
const tabContentStart = `                  {/* Messages Tab */}
                  {activeTab === 'messages' && (`;
const tabContentEnd = `                  {/* Stats Tab */}`;

let beforeTab = content.substring(0, content.indexOf(tabContentStart) + tabContentStart.length);
let afterTab = content.substring(content.indexOf(tabContentEnd));

const newTabContent = `
                    <div className="h-[600px] flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                      {/* Threads List Sidebar */}
                      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
                        <div className="p-4 border-b border-gray-200 bg-white">
                          <h3 className="font-bold text-gray-800">Danh sách Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                          {messages.map((thread: any) => (
                            <div 
                              key={thread.visitor_id}
                              onClick={() => setActiveVisitorId(thread.visitor_id)}
                              className={\`p-3 rounded-lg cursor-pointer transition-colors \${activeVisitorId === thread.visitor_id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-white border border-gray-100 hover:border-blue-300 hover:shadow-sm'}\`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm truncate flex-1">Khách: {thread.visitor_id.substring(0,8)}</span>
                                {thread.unread_count > 0 && (
                                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                                    {thread.unread_count} mới
                                  </span>
                                )}
                              </div>
                              <p className={\`text-xs truncate \${activeVisitorId === thread.visitor_id ? 'text-gray-100' : 'text-gray-500'} \${thread.unread_count > 0 ? 'font-bold' : ''}\`}>
                                {thread.last_sender === 'admin' ? 'Bạn: ' : ''}{thread.last_message || 'File đính kèm'}
                              </p>
                              <div className={\`text-[10px] mt-2 text-right \${activeVisitorId === thread.visitor_id ? 'text-gray-200' : 'text-gray-400'}\`}>
                                {new Date(thread.last_message_time).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          ))}
                          {messages.length === 0 && (
                            <div className="text-center p-4 text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</div>
                          )}
                        </div>
                      </div>

                      {/* Chat Window */}
                      <div className="flex-1 flex flex-col bg-slate-50">
                        {activeVisitorId ? (
                           <>
                             <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center shrink-0">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                   KH
                                 </div>
                                 <div>
                                   <h4 className="font-bold text-gray-800">Khách: {activeVisitorId.substring(0,8)}</h4>
                                   <span className="text-xs text-green-500 flex items-center gap-1">
                                     <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Đang trực tuyến
                                   </span>
                                 </div>
                               </div>
                             </div>

                             <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                               {visitorMessages.map((msg, i) => {
                                 const isAdmin = msg.sender_type === 'admin';
                                 return (
                                   <div key={i} className={\`flex max-w-[70%] \${isAdmin ? 'self-end' : 'self-start'}\`}>
                                     {!isAdmin && (
                                       <div className="w-8 h-8 rounded-full bg-blue-500 shrink-0 flex items-center justify-center text-white mr-2 mt-auto text-xs font-bold shadow-sm">
                                         KH
                                       </div>
                                     )}
                                     <div className={\`flex flex-col gap-1 \${isAdmin ? 'items-end' : 'items-start'}\`}>
                                       <div 
                                         className={\`px-4 py-2.5 text-sm shadow-sm \${
                                           isAdmin 
                                             ? 'bg-[var(--color-primary)] text-white rounded-2xl rounded-br-sm' 
                                             : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                                         }\`}
                                       >
                                         {msg.content}
                                         {(msg.file_url || msg.fileUrl) && (
                                           <a 
                                             href={msg.file_url || msg.fileUrl} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             className={\`mt-2 flex items-center gap-2 p-2 rounded-lg \${isAdmin ? 'bg-black/10' : 'bg-gray-50 border border-gray-100'} hover:opacity-80 transition-opacity\`}
                                           >
                                             {(msg.file_url || msg.fileUrl).match(/\\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                               <img src={msg.file_url || msg.fileUrl} alt="attachment" className="max-w-[250px] rounded object-cover cursor-pointer" />
                                             ) : (
                                               <>
                                                <FileText size={16} />
                                                <span className="text-sm truncate max-w-[200px] font-medium">{msg.file_name || msg.fileName || 'Tệp đính kèm'}</span>
                                               </>
                                             )}
                                           </a>
                                         )}
                                       </div>
                                       <span className="text-[10px] text-gray-400 px-1 font-medium select-none">
                                         {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                     </div>
                                   </div>
                                 )
                               })}
                               <div ref={visitorEndRef} />
                             </div>

                             <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                               <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 p-2 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
                                 <button 
                                   onClick={() => adminFileInputRef.current?.click()}
                                   disabled={isUploadingObj}
                                   className="p-2.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-white rounded-lg transition-colors shrink-0"
                                   title="Đính kèm tệp"
                                 >
                                   <Paperclip size={20} />
                                 </button>
                                 <input 
                                   type="file" 
                                   ref={adminFileInputRef} 
                                   className="hidden" 
                                   onChange={handleAdminFileUpload}
                                 />
                                 
                                 <textarea 
                                   value={adminInput}
                                   onChange={(e) => setAdminInput(e.target.value)}
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter' && !e.shiftKey) {
                                       e.preventDefault();
                                       sendAdminMessage();
                                     }
                                   }}
                                   placeholder={isUploadingObj ? "Đang tải tệp lên..." : "Nhập phản hồi cho khách hàng..."}
                                   className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-sm py-3 px-2 placeholder:text-gray-400"
                                   rows={Math.min(4, adminInput.split('\\n').length || 1)}
                                   disabled={isUploadingObj}
                                 />
                                 
                                 <button 
                                   onClick={sendAdminMessage}
                                   disabled={(!adminInput.trim() && !isUploadingObj) || isUploadingObj}
                                   className="p-2.5 bg-[var(--color-primary)] text-white gap-2 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 shrink-0 shadow-sm flex items-center font-medium"
                                   title="Gửi tin nhắn"
                                 >
                                   <Send size={18} /> Gửi
                                 </button>
                               </div>
                             </div>
                           </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <MessageSquare size={64} className="text-gray-300" />
                            <p>Chọn một cuộc trò chuyện để bắt đầu phản hồi</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

`;

fs.writeFileSync('src/components/AdminDashboard.tsx', beforeTab + newTabContent + afterTab);
console.log('AdminDashboard patched with Live Chat');

