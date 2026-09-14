import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, ImageIcon, Video, Paperclip, FileText, Send } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LiveChatModalProps {
  record: any;
  users: any[];
  onClose: () => void;
  language?: "vi" | "en";
}

export default function LiveChatModal({ record, users, onClose, language = "vi" }: LiveChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine visitorId based on record's linked client
    const clientUser = users.find(u => u.role === 'client' && (u.case_id === record?.systemId || u.case_id === record?.id));
    const vid = clientUser?.username || (clientUser?.id ? `client_${clientUser.id}` : null);
    
    if (vid) {
      setVisitorId(vid);
      // Fetch existing messages
      fetch(`/api/live-messages/${vid}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(console.error);

      // Connect socket
      const s = io();
      setSocket(s);

      s.on("connect", () => {
        s.emit("join_admin");
        s.emit("mark_read", vid); // Admin marking messages from this client as read
      });

      s.on("receive_message", (msg: any) => {
        if (msg.visitorId === vid || msg.visitor_id === vid) {
          setMessages(prev => {
            const exists = prev.find(p => p.id === msg.id && msg.id);
            if (exists) return prev;
            return [...prev, msg];
          });
          // Also mark as read if admin is viewing it
          if (msg.senderType === 'visitor' || msg.sender_type === 'visitor') {
            s.emit("mark_read", vid);
          }
        }
      });

      return () => {
        s.disconnect();
      };
    }
  }, [record, users]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !socket || !visitorId) return;

    socket.emit("send_message", {
      visitorId,
      senderType: "admin",
      content: newMessage,
    });
    setNewMessage("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !visitorId) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/live-upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.url) {
        socket.emit("send_message", {
          visitorId,
          senderType: "admin",
          content: `Đã gửi tệp đính kèm: ${file.name}`,
          fileUrl: data.url,
          fileName: file.name,
        });
      }
    } catch (err) {
      console.error(err);
    }
    if (e.target) e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {language === "vi" ? "Trao đổi với Khách Hàng" : "Chat with Client"}
              </h2>
              <p className="text-xs text-slate-500">{record?.title || record?.systemId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {!visitorId ? (
            <div className="text-center text-slate-500 mt-10">
              {language === "vi" ? "Hồ sơ này chưa được liên kết với tài khoản khách hàng nào." : "This record is not linked to any client account."}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              {language === "vi" ? "Chưa có tin nhắn." : "No messages yet."}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAdmin = msg.senderType === "admin" || msg.sender_type === "admin";
              return (
                <div key={idx} className={cn("flex flex-col max-w-[80%]", isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className={cn("px-4 py-2 rounded-lg text-sm", isAdmin ? "bg-blue-600 text-white" : "bg-white text-slate-800 border border-slate-200")}>
                    {msg.content}
                    {(msg.fileUrl || msg.file_url) && (
                      <div className="mt-2 p-2 bg-black/5 rounded-lg border border-black/5 flex items-center gap-2">
                        <Paperclip size={16} />
                        <a href={msg.fileUrl || msg.file_url} target="_blank" rel="noreferrer" className="text-xs hover:underline truncate hover:text-blue-200">
                          {msg.fileName || msg.file_name || "Tệp đính kèm"}
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {visitorId && (
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
            <label className="cursor-pointer p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all active:scale-95">
              <Paperclip size={18} />
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={language === "vi" ? "Nhập tin nhắn..." : "Type a message..."}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
