import React, { useState } from "react";
import { Phone, MessageCircle, MessageSquare, Facebook, X, Youtube, Linkedin, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useContactSettings } from "../hooks/useContactSettings";

export default function BottomLeftContacts() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useContactSettings();

  const phoneClean = (settings.hotline_consult || "19003330").replace(/\D/g, "");

  const contactItems = [
    {
      id: "phone",
      label: `Gọi điện (${settings.hotline_consult || "1900 3330"})`,
      icon: <Phone size={20} className="fill-white" />,
      color: "bg-[#16566D]",
      shadow: "shadow-blue-500/30",
      href: `tel:${phoneClean}`,
    },
    {
      id: "zalo",
      label: "Chat Zalo OA",
      icon: <span className="font-bold text-xs">Zalo</span>,
      color: "bg-[#0068FF]",
      shadow: "shadow-blue-500/30",
      href: settings.zalo_url || `https://zalo.me/${phoneClean}`,
    },
    {
      id: "facebook",
      label: "Trang Facebook",
      icon: <Facebook size={20} className="fill-white" />,
      color: "bg-[#1877F2]",
      shadow: "shadow-indigo-500/30",
      href: settings.facebook_url || "https://facebook.com/anhduonglaw.vn",
    },
    {
      id: "messenger",
      label: "Messenger",
      icon: <MessageCircle size={20} className="fill-white" />,
      color: "bg-gradient-to-tr from-[#00C6FF] to-[#0072FF]",
      shadow: "shadow-blue-500/30",
      href: settings.messenger_url || "https://m.me/anhduonglaw.vn",
    },
    {
      id: "youtube",
      label: "YouTube Channel",
      icon: <Youtube size={20} className="fill-white" />,
      color: "bg-[#FF0000]",
      shadow: "shadow-red-500/30",
      href: settings.youtube_url || "https://youtube.com/@anhduonglaw",
    },
    {
      id: "sms",
      label: "Gửi SMS",
      icon: <MessageSquare size={20} className="fill-white" />,
      color: "bg-[#F97316]",
      shadow: "shadow-orange-500/30",
      href: `sms:${phoneClean}`,
    },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3">
      {/* Expanded Contacts Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-start gap-3">
            {contactItems.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.7, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-12 h-12 ${item.color} ${item.shadow} text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer relative group`}
                title={item.label}
              >
                {item.icon}

                {/* Left Tooltip sliding to the right */}
                <span className="absolute left-14 pl-1 hidden group-hover:block whitespace-nowrap bg-[#0F172A] text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-md animate-in fade-in slide-in-from-left-2 duration-150 border border-slate-700/50">
                  {item.label}
                </span>
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border border-[var(--color-accent)]/30 relative overflow-hidden group animate-pulse-gold"
        title="Liên hệ nhanh"
      >
        {/* Pulsating background circle overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] opacity-95 group-hover:opacity-100 transition-opacity z-0"></div>

        <span className="relative z-10">
          {isOpen ? (
            <X size={26} className="transition-transform rotate-0" />
          ) : (
            <Phone size={26} className="transition-transform animate-ring" />
          )}
        </span>
      </motion.button>
    </div>
  );
}
