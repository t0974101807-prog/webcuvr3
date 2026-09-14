import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Shield, 
  Hash, 
  Plus, 
  Users, 
  Search, 
  AlertCircle, 
  FileText, 
  Check, 
  CheckCheck, 
  Smile, 
  Info,
  Trash2,
  Pin,
  PinOff,
  ChevronDown,
  X,
  Tag
} from "lucide-react";
import { io, Socket } from "socket.io-client";

interface KenhChatViewProps {
  language: "vi" | "en";
  user: any;
  users: any[];
}

const CATEGORIES = [
  { id: "all", labelVi: "Tất cả", labelEn: "All" },
  { id: "general", labelVi: "Chung", labelEn: "General" },
  { id: "tranh_tung", labelVi: "Tranh tụng", labelEn: "Litigation" },
  { id: "tu_van", labelVi: "Tư vấn", labelEn: "Advisory" },
  { id: "phap_che", labelVi: "Pháp chế", labelEn: "Corporate" },
  { id: "ban_giam_doc", labelVi: "Ban Giám đốc", labelEn: "Executive" }
];

const EMOJIS = ["👍", "❤️", "⚖️", "🎯", "👏"];

export default function KenhChatView({ language = "vi", user, users = [] }: KenhChatViewProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [selectedDMUser, setSelectedDMUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelCategory, setNewChannelCategory] = useState("general");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  // Soft-delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Pinned messages state
  const [showPinnedBanner, setShowPinnedBanner] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPartner = user?.role === 'partner' || user?.account_type === 'PARTNER';
  const isAdminOrManager = ['admin', 'manager', 'director', 'superadmin'].includes(user?.role?.toLowerCase() || "");

  // Connect socket and listen
  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on("connect", () => {
      if (user?.id) {
        s.emit("join_chat_user", user.id);
      }
    });

    s.on("receive_chat_message", (msg: any) => {
      // If looking at this channel
      if (selectedChannel && msg.channel_id === selectedChannel.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // If looking at this DM
      else if (selectedDMUser && !msg.channel_id && (
        (msg.sender_id === user.id && msg.receiver_id === selectedDMUser.id) ||
        (msg.sender_id === selectedDMUser.id && msg.receiver_id === user.id)
      )) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Also refresh channel list for unread badges
      fetchChannels();
    });

    s.on("chat_channel_created", () => {
      fetchChannels();
    });

    s.on("chat_channel_deleted", (data: any) => {
      fetchChannels();
      const delId = Number(data?.channelId || data?.id);
      if (selectedChannel && Number(selectedChannel.id) === delId) {
        setSelectedChannel(null);
      }
    });

    s.on("chat_channel_restored", () => {
      fetchChannels();
    });

    s.on("chat_message_pinned", (data: any) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_pinned: data.is_pinned } : m));
    });

    s.on("chat_reactions_updated", (data: any) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
    });

    return () => {
      s.disconnect();
    };
  }, [selectedChannel, selectedDMUser, user]);

  // Fetch channels list
  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/chat/channels", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setChannels(data);
        // Set default channel on first load
        if (!selectedChannel && !selectedDMUser && data.length > 0) {
          const defaultChan = data.find(c => c.name === "chung-toan-van-phong") || data[0];
          handleSelectChannel(defaultChan);
        }
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [user]);

  // Fetch messages when channel or DM user is selected
  useEffect(() => {
    if (selectedChannel) {
      fetch(`/api/chat/channels/${selectedChannel.id}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(console.error);

      if (socket) {
        socket.emit("join_chat_channel", selectedChannel.id);
      }
    } else if (selectedDMUser) {
      fetch(`/api/chat/direct/${selectedDMUser.id}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(console.error);
    }
  }, [selectedChannel, selectedDMUser]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectChannel = (chan: any) => {
    setSelectedDMUser(null);
    setSelectedChannel(chan);
  };

  const handleSelectDM = (targetUser: any) => {
    setSelectedChannel(null);
    setSelectedDMUser(targetUser);
  };

  // Create channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newChannelName,
          description: newChannelDesc,
          category: newChannelCategory,
          is_private: newChannelPrivate,
          member_ids: newChannelPrivate ? [...selectedMembers, user.id] : []
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateChannel(false);
        setNewChannelName("");
        setNewChannelDesc("");
        setNewChannelCategory("general");
        setNewChannelPrivate(false);
        setSelectedMembers([]);
        fetchChannels();
        if (data.channel) {
          handleSelectChannel(data.channel);
        }
      } else {
        alert(data.error || "Không thể tạo kênh");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối");
    }
  };

  // Soft-delete channel (moves to Recycle Bin)
  const handleDeleteChannel = async () => {
    if (!selectedChannel) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chat/channels/${selectedChannel.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: deleteReason.trim() || (language === "vi" ? "Người dùng xóa kênh trò chuyện" : "User deleted chat channel")
        })
      });

      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setDeleteReason("");
        setSelectedChannel(null);
        fetchChannels();
      } else {
        alert(data.error || "Không thể xóa kênh");
      }
    } catch (err: any) {
      alert("Lỗi xóa kênh: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Pin / Unpin message
  const handleTogglePin = async (messageId: number) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/pin`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned: data.is_pinned } : m));
      }
    } catch (err) {
      console.error("Pin error:", err);
    }
  };

  // Add / Toggle reaction
  const handleToggleReaction = async (messageId: number, emoji: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m));
      }
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !socket || !user) return;

    socket.emit("send_chat_message", {
      channelId: selectedChannel?.id || null,
      senderId: user.id,
      receiverId: selectedDMUser?.id || null,
      content: newMessage,
      fileUrl: null,
      fileName: null
    });

    setNewMessage("");
  };

  // File Upload Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/live-upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();

      if (data.url) {
        socket.emit("send_chat_message", {
          channelId: selectedChannel?.id || null,
          senderId: user.id,
          receiverId: selectedDMUser?.id || null,
          content: `${language === "vi" ? "📎 Đã gửi tệp đính kèm:" : "📎 Sent attachment:"} ${file.name}`,
          fileUrl: data.url,
          fileName: file.name
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(language === "vi" ? "Tải lên tệp thất bại" : "File upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Filter channels based on Search and Category
  const filteredChannels = channels.filter(c => {
    const matchesSearch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategory === "all") return matchesSearch;
    return matchesSearch && (c.category === activeCategory);
  });

  // Filter users based on Search and Role rules
  const filteredUsers = users.filter(u => {
    if (u.id === user?.id) return false; // Hide self
    const matchesSearch = (u.name || u.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (isPartner) {
      return matchesSearch && u.account_type !== 'PARTNER' && u.role !== 'client';
    }
    return matchesSearch;
  });

  // Can current user delete selected channel?
  const canDeleteCurrentChannel = Boolean(
    selectedChannel && (
      isAdminOrManager || 
      Number(selectedChannel.created_by) === Number(user?.id)
    )
  );

  const pinnedMessages = messages.filter(m => m.is_pinned);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[74vh]">
      
      {/* 1. SIDEBAR (CHANNELS & DMS) */}
      <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800/80 flex flex-col">
        {/* User profile header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-850 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100 uppercase border border-slate-300 dark:border-slate-800">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                (user?.name || user?.username || "?")[0]
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {user?.name || user?.username}
              </p>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                {user?.role || "Staff"}
              </span>
            </div>
          </div>
        </div>

        {/* Global search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm nhân viên, kênh..." : "Search users, channels..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-hidden text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-3 pb-2 flex gap-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => {
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  isCatActive
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300/80 dark:hover:bg-slate-700"
                }`}
              >
                {language === "vi" ? cat.labelVi : cat.labelEn}
              </button>
            );
          })}
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span>{language === "vi" ? "KÊNH TRÒ CHUYỆN" : "CHANNELS"}</span>
              {!isPartner && (
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md cursor-pointer transition"
                  title={language === "vi" ? "Tạo kênh mới" : "Create new channel"}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-0.5">
              {filteredChannels.length === 0 ? (
                <p className="text-[11px] text-slate-400 px-3 py-1 italic">
                  {language === "vi" ? "Không tìm thấy kênh" : "No channels found"}
                </p>
              ) : (
                filteredChannels.map((chan) => {
                  const isActive = selectedChannel?.id === chan.id;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => handleSelectChannel(chan)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        isActive
                          ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{chan.name}</span>
                        {chan.is_private === 1 && (
                          <Shield size={10} className="text-slate-500 shrink-0" />
                        )}
                      </div>
                      {chan.unread_count > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {chan.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {language === "vi" ? "CHAT TRỰC TIẾP" : "DIRECT MESSAGES"}
            </div>

            <div className="space-y-0.5">
              {filteredUsers.map((u) => {
                const isActive = selectedDMUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectDM(u)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isActive
                        ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded-md bg-slate-300 dark:bg-slate-700 flex items-center justify-center font-bold text-[9px] uppercase">
                        {u.avatar ? (
                          <img src={u.avatar} alt="avatar" className="w-5 h-5 rounded-md object-cover" />
                        ) : (
                          (u.name || u.username || "?")[0]
                        )}
                      </div>
                      <span className="truncate">{u.name || u.username}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHAT PANEL */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0">
        
        {/* Chat Header */}
        {selectedChannel || selectedDMUser ? (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-slate-100 dark:bg-slate-850 rounded-xl text-slate-600 dark:text-slate-300 shrink-0">
                {selectedChannel ? <Hash size={18} /> : <MessageSquare size={18} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedChannel ? selectedChannel.name : (selectedDMUser.name || selectedDMUser.username)}
                  </h3>
                  {selectedChannel?.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      {selectedChannel.category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {selectedChannel 
                    ? (selectedChannel.description || (language === "vi" ? "Kênh cộng tác dự án" : "Project collaboration channel"))
                    : `${language === "vi" ? "Trò chuyện trực tiếp với" : "Direct chat with"} ${selectedDMUser.name || selectedDMUser.username}`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Read-only banner for announcements channel */}
              {selectedChannel?.name === "thông-báo-nội-bộ" && (
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  <Info size={12} />
                  <span>{language === "vi" ? "Chỉ admin được phép gửi bài" : "Announcement Mode Only"}</span>
                </div>
              )}

              {/* Move Channel to Recycle Bin button */}
              {selectedChannel && canDeleteCurrentChannel && (
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition cursor-pointer"
                  title={language === "vi" ? "Xóa kênh (Chuyển vào Thùng rác)" : "Delete channel (Move to Recycle Bin)"}
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">
                    {language === "vi" ? "Xóa kênh" : "Delete"}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold">
              {language === "vi" ? "Chào mừng đến với Kênh Chat Legal OS" : "Welcome to Legal OS Chat Channel"}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {language === "vi"
                ? "Lựa chọn một kênh hoặc đồng nghiệp ở cột bên trái để bắt đầu trao đổi công việc realtime."
                : "Select a channel or colleague from the left menu to start real-time workspace discussions."
              }
            </p>
          </div>
        )}

        {/* Pinned Messages Banner */}
        {selectedChannel && pinnedMessages.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Pin size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold text-amber-800 dark:text-amber-300 shrink-0">
                {pinnedMessages.length} {language === "vi" ? "tin nhắn đã ghim" : "pinned messages"}:
              </span>
              <span className="text-amber-700 dark:text-amber-400 truncate">
                {pinnedMessages[pinnedMessages.length - 1]?.content}
              </span>
            </div>
          </div>
        )}

        {/* Messages list */}
        {(selectedChannel || selectedDMUser) && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const reactions: any[] = msg.reactions || [];

              // Group reactions by emoji
              const emojiCounts: Record<string, { count: number; users: string[]; hasReacted: boolean }> = {};
              for (const r of reactions) {
                if (!emojiCounts[r.emoji]) {
                  emojiCounts[r.emoji] = { count: 0, users: [], hasReacted: false };
                }
                emojiCounts[r.emoji].count++;
                emojiCounts[r.emoji].users.push(r.user_name || "User");
                if (Number(r.user_id) === Number(user?.id)) {
                  emojiCounts[r.emoji].hasReacted = true;
                }
              }

              return (
                <div 
                  key={msg.id || idx} 
                  className={`group relative flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-slate-300 dark:border-slate-800 shadow-xs">
                    {msg.sender_avatar ? (
                      <img src={msg.sender_avatar} alt="avatar" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      (msg.sender_name || msg.sender_username || "?")[0]
                    )}
                  </div>
                  
                  <div className="space-y-1 max-w-full">
                    <div className={`flex items-baseline gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isMe ? (language === "vi" ? "Tôi" : "Me") : msg.sender_name}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                      {msg.is_pinned === 1 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/40 px-1 py-0.2 rounded">
                          <Pin size={9} /> {language === "vi" ? "Đã ghim" : "Pinned"}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      {/* Hover action menu for emojis & pin */}
                      <div className={`absolute -top-7 ${isMe ? "right-0" : "left-0"} hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-md z-10 animate-in fade-in duration-150`}>
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs p-1 cursor-pointer"
                            title={`React ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                        {selectedChannel && (
                          <button
                            onClick={() => handleTogglePin(msg.id)}
                            className={`p-1 hover:text-amber-500 rounded cursor-pointer transition ${msg.is_pinned ? "text-amber-500 font-bold" : "text-slate-400"}`}
                            title={msg.is_pinned ? (language === "vi" ? "Bỏ ghim" : "Unpin") : (language === "vi" ? "Ghim tin nhắn" : "Pin message")}
                          >
                            {msg.is_pinned ? <PinOff size={11} /> : <Pin size={11} />}
                          </button>
                        )}
                      </div>

                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-xs"
                      }`}>
                        {msg.file_url ? (
                          <div className="flex items-center gap-3 p-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-slate-200/10">
                            <FileText size={24} className="text-slate-500 shrink-0" />
                            <div className="truncate pr-4">
                              <p className="font-bold text-xs truncate max-w-[200px]">{msg.file_name || "Attachment"}</p>
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline mt-0.5 block"
                              >
                                {language === "vi" ? "Tải xuống" : "Download File"}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>

                    {/* Reactions list */}
                    {Object.keys(emojiCounts).length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                        {Object.entries(emojiCounts).map(([emoji, info]) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            title={info.users.join(", ")}
                            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border cursor-pointer transition ${
                              info.hasReacted 
                                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold"
                                : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{info.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        {(selectedChannel || selectedDMUser) && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {/* Announcement blocking check */}
            {selectedChannel?.name === "thông-báo-nội-bộ" && user?.role !== "admin" && user?.role !== "director" ? (
              <div className="text-center py-2 text-xs text-slate-400 font-semibold italic">
                {language === "vi" ? "🔒 Bạn chỉ có quyền đọc trên kênh Thông báo này." : "🔒 You only have read permission on this Announcement channel."}
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                />
                
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition disabled:opacity-50 shrink-0"
                  title={language === "vi" ? "Đính kèm tài liệu" : "Attach Document"}
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder={language === "vi" ? "Nhập nội dung tin nhắn..." : "Type your message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs outline-hidden text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-850 dark:hover:bg-white cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 3. CREATE CHANNEL DIALOG */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-lg animate-in fade-in-50 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === "vi" ? "Tạo kênh trò chuyện mới" : "Create New Chat Channel"}
              </h3>
              <button
                onClick={() => setShowCreateChannel(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "vi" ? "Tên kênh:" : "Channel Name:"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: tranh-tung-toa-an-quan-1"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-slate-500 outline-hidden text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "vi" ? "Phân loại kênh:" : "Channel Category:"}
                </label>
                <select
                  value={newChannelCategory}
                  onChange={(e) => setNewChannelCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-slate-500 outline-hidden text-slate-800 dark:text-slate-100"
                >
                  <option value="general">{language === "vi" ? "Chung toàn văn phòng" : "General"}</option>
                  <option value="tranh_tung">{language === "vi" ? "Tranh tụng Tòa án" : "Litigation"}</option>
                  <option value="tu_van">{language === "vi" ? "Tư vấn & Hợp đồng" : "Advisory"}</option>
                  <option value="phap_che">{language === "vi" ? "Pháp chế Doanh nghiệp" : "Corporate"}</option>
                  <option value="ban_giam_doc">{language === "vi" ? "Ban Giám đốc" : "Executive"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "vi" ? "Mô tả mục đích kênh:" : "Channel Description:"}
                </label>
                <textarea
                  placeholder={language === "vi" ? "ví dụ: Trao đổi hồ sơ vụ việc..." : "e.g. Channel for sharing..."}
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-slate-500 outline-hidden text-slate-800 dark:text-slate-100"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-slate-850/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === "vi" ? "Kênh Riêng tư (Private):" : "Private Channel:"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === "vi" ? "Chỉ những thành viên được gán mới có quyền xem" : "Only assigned members can view"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 cursor-pointer"
                />
              </div>

              {newChannelPrivate && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === "vi" ? "Chọn thành viên tham gia:" : "Select Members:"}
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1">
                    {users.map(u => {
                      if (u.id === user.id) return null;
                      const isSelected = selectedMembers.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedMembers(prev => prev.filter(id => id !== u.id));
                              } else {
                                setSelectedMembers(prev => [...prev, u.id]);
                              }
                            }}
                            className="w-3.5 h-3.5 text-slate-900 border-slate-300 rounded focus:ring-slate-500 cursor-pointer"
                          />
                          <span>{u.name || u.username} ({u.role})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-800 dark:hover:bg-white transition"
                >
                  {language === "vi" ? "Tạo kênh" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SOFT DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && selectedChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {language === "vi" ? "Chuyển kênh vào Thùng rác?" : "Move channel to Recycle Bin?"}
                </h3>
                <p className="text-xs text-slate-500">
                  #{selectedChannel.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === "vi" 
                ? "Kênh và toàn bộ tin nhắn sẽ được ẩn khỏi hệ thống và lưu tạm tại Thùng rác trong 30 ngày. Bạn có thể khôi phục lại bất kỳ lúc nào."
                : "The channel and all messages will be hidden and retained in the Recycle Bin for 30 days. You can restore it anytime."
              }
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === "vi" ? "Lý do xóa (ghi nhận vào Audit Log):" : "Deletion reason (Audit Log):"}
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={language === "vi" ? "Ví dụ: Đã hoàn tất dự án, không còn nhu cầu trao đổi..." : "e.g. Project completed..."}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-hidden text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition"
              >
                {language === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteChannel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>
                  {isDeleting 
                    ? (language === "vi" ? "Đang xử lý..." : "Processing...") 
                    : (language === "vi" ? "Xác nhận xóa" : "Confirm Delete")
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
