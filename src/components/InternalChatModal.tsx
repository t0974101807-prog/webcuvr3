import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Paperclip, Send } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchApi } from "../utils/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InternalChatModalProps {
  record: any;
  user: any;
  onClose: () => void;
  language?: "vi" | "en";
}

export default function InternalChatModal({ record, user, onClose, language = "vi" }: InternalChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recordId = record?.systemId || record?.id;

  useEffect(() => {
    if (recordId) {
      // Fetch existing messages
      fetch(`/api/internal-messages/${recordId}`, {
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
        s.emit("join_record", recordId);
        s.emit("mark_internal_messages_read", { recordId });
      });

      s.on("receive_internal_message", (msg: any) => {
        if (msg.record_id === recordId) {
          setMessages(prev => {
            const exists = prev.find(p => p.id === msg.id && msg.id);
            if (exists) return prev;
            return [...prev, msg];
          });
          // Also mark as read immediately if chat is open
          s.emit("mark_internal_messages_read", { recordId });
        }
      });

      return () => {
        s.disconnect();
      };
    }
  }, [recordId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !socket || !recordId || !user) return;

    socket.emit("send_internal_message", {
      recordId,
      senderName: user.name || user.username || "Unknown",
      senderRole: user.role || "staff",
      content: newMessage,
    });
    setNewMessage("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !recordId || !user) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchApi("/api/secure-upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.url) {
        socket.emit("send_internal_message", {
          recordId,
          senderName: user.name || user.username || "Unknown",
          senderRole: user.role || "staff",
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
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {language === "vi" ? "Trao đổi Nội bộ" : "Internal Chat"}
              </h2>
              <p className="text-xs text-slate-500">{record?.title || record?.systemId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {!recordId ? (
            <div className="text-center text-slate-500 mt-10">
              {language === "vi" ? "Không tìm thấy thông tin hồ sơ." : "Record info not found."}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              {language === "vi" ? "Chưa có tin nhắn." : "No messages yet."}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_name === (user?.name || user?.username);
              return (
                <div key={idx} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                  {!isMe && (
                     <span className="text-xs font-semibold text-slate-600 mb-1 ml-1">{msg.sender_name}</span>
                  )}
                  <div className={cn("px-4 py-2 rounded-lg text-sm", isMe ? "bg-indigo-600 text-white" : "bg-white text-slate-800 border border-slate-200")}>
                    {msg.content}
                    {(msg.fileUrl || msg.file_url) && (
                      <div className="mt-2 p-2 bg-black/5 rounded-lg border border-black/5 flex items-center gap-2">
                        <Paperclip size={16} />
                        <a href={msg.fileUrl || msg.file_url} target="_blank" rel="noreferrer" className="text-xs hover:underline truncate hover:text-indigo-200">
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

        {recordId && (
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
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
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
