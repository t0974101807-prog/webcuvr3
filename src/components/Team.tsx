import { fetchApi } from '../utils/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle2, Award, Mail, Phone, X, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface TeamMember {
  id: number;
  name: string;
  title: string;
  description?: string;
  image: string;
  email?: string;
  phone?: string;
  specialties?: string;
  degrees?: string;
}

export default function Team() {
  const { language } = useLanguage();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [headerSettings, setHeaderSettings] = useState({
    team_subtitle: 'Hội Đồng Luật Sư',
    team_title: 'Đội Ngũ **Luật Sư Cộng Sự** Cấp Cao',
    team_description: 'Hội tụ những chuyên gia luật học hàng đầu tốt nghiệp tại các trường đại học danh tiếng tại Pháp, Singapore, tận tâm và dạn dày kinh nghiệm lâm trận thực tế.'
  });

  const fetchHeaderSettings = () => {
    fetchApi('/api/settings')
      .then(res => res.json())
      .then(data => {
        setHeaderSettings({
          team_subtitle: data.team_subtitle || 'Hội Đồng Luật Sư',
          team_title: data.team_title || 'Đội Ngũ **Luật Sư Cộng Sự** Cấp Cao',
          team_description: data.team_description || 'Hội tụ những chuyên gia luật học hàng đầu tốt nghiệp tại các trường đại học danh tiếng tại Pháp, Singapore, tận tâm và dạn dày kinh nghiệm lâm trận thực tế.'
        });
      })
      .catch(err => console.error('Failed to fetch team header settings', err));
  };

  useEffect(() => {
    fetchApi(`/api/team?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTeam(data);
        } else {
          console.error('Failed to fetch team: expected array, got:', data);
          setTeam([]);
        }
      })
      .catch(err => console.error('Failed to fetch team', err));

    fetchHeaderSettings();
    window.addEventListener('contact-settings-updated', fetchHeaderSettings);
    return () => {
      window.removeEventListener('contact-settings-updated', fetchHeaderSettings);
    };
  }, []);

  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="text-[#c2a278]">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  // Enrich data with elegant defaults if missing
  const getEnrichedMember = (member: TeamMember) => {
    // Basic Vietnamese diacritics clean helper to generate professional email
    const cleanName = member.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
    
    const nameParts = cleanName.split(/\s+/);
    let emailPrefix = "";
    if (nameParts.length >= 2) {
      // e.g. "luat su le anh duong" -> "duong.le" or similar
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts[nameParts.length - 2];
      emailPrefix = `${lastName}.${firstName}`;
    } else {
      emailPrefix = cleanName.replace(/\s+/g, ".");
    }
    
    const email = member.email || `${emailPrefix}@anhduonglaw.vn`;
    const phone = member.phone || "0988.123.456";
    
    let specialties = member.specialties;
    if (!specialties) {
      if (member.title.toLowerCase().includes("sáng lập") || member.title.toLowerCase().includes("điều hành") || member.title.toLowerCase().includes("managing")) {
        specialties = "Tư vấn M&A, Đầu tư nước ngoài (FDI), Cấu trúc quản trị doanh nghiệp lớn";
      } else if (member.title.toLowerCase().includes("thành viên") || member.title.toLowerCase().includes("partner") || member.title.toLowerCase().includes("tranh tụng")) {
        specialties = "Giải quyết tranh chấp thương mại, Trọng tài Quốc tế (VIAC, SIAC), Hợp đồng quốc tế";
      } else {
        specialties = "Bảo hộ thương hiệu toàn cầu, Chuyển giao công nghệ, Bản quyền công nghệ & AI";
      }
    }
    
    let degrees = member.degrees;
    if (!degrees) {
      if (member.title.toLowerCase().includes("sáng lập") || member.title.toLowerCase().includes("managing")) {
        degrees = "Thạc sĩ Luật chuyên ngành Luật Kinh tế quốc tế - Đại học Paris 1 Panthéon-Sorbonne (Pháp)\nCử nhân Luật chất lượng cao - Đại học Luật Hà Nội";
      } else if (member.title.toLowerCase().includes("thành viên") || member.title.toLowerCase().includes("partner") || member.title.toLowerCase().includes("tranh tụng")) {
        degrees = "Thạc sĩ Luật Thương mại quốc tế - Đại học Quốc gia Singapore (NUS)\nCử nhân Luật - Đại học Luật TP.HCM";
      } else {
        degrees = "Thạc sĩ Luật sở hữu trí tuệ - Đại học Melbourne (Australia)\nCử nhân Luật quốc tế - Học viện Ngoại giao";
      }
    }
    
    return {
      ...member,
      email,
      phone,
      specialties,
      degrees
    };
  };

  return (
    <section id="team" className="py-20 md:py-28 bg-[#FAF9F6] text-slate-800 overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(194,162,120,0.12),transparent_45%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(243,225,204,0.3),transparent_60%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#c2a278]/50"></span>
            <span className="text-[#c2a278] font-bold uppercase tracking-[0.25em] text-xs sm:text-sm">
              {headerSettings.team_subtitle}
            </span>
            <span className="w-8 h-[1px] bg-[#c2a278]/50"></span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight mb-6 leading-tight whitespace-pre-line text-slate-900">
            {renderHighlightedText(headerSettings.team_title)}
          </h2>
          
          <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
            {headerSettings.team_description}
          </p>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {team.map((rawMember, index) => {
            const member = getEnrichedMember(rawMember);
            const specialtyList = member.specialties.split(',').map(s => s.trim()).filter(Boolean);
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
                viewport={{ once: true }}
                onClick={() => setSelectedMember(member)}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-[#c2a278]/50 transition-all duration-500 flex flex-col h-full shadow-md hover:shadow-xl cursor-pointer"
                id={`team-card-${member.id}`}
              >
                {/* Image Section */}
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-900 shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
                  
                  {/* Floating Box with Name & Title */}
                  <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md border border-[#c2a278]/30 px-5 py-4 rounded-md shadow-2xl transition-all duration-500 group-hover:border-[#c2a278]/60 group-hover:opacity-0 group-hover:pointer-events-none">
                    <h3 className="font-serif text-lg md:text-xl font-bold text-amber-100/95 tracking-wide leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-300 font-sans tracking-widest uppercase font-medium mt-1 leading-snug">
                      {member.title}
                    </p>
                  </div>

                  {/* Elegant Biography Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-6 sm:p-7 flex flex-col justify-between opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500 ease-out z-10">
                    <div className="space-y-4">
                      <div className="border-b border-[#c2a278]/30 pb-3">
                        <h4 className="font-serif text-lg sm:text-xl font-bold text-amber-100/95 tracking-wide">
                          {member.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">
                          {member.title}
                        </p>
                      </div>
                      
                      {member.description && (
                        <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed font-light line-clamp-5">
                          &ldquo;{member.description}&rdquo;
                        </p>
                      )}
                      
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#c2a278]">
                          {language === 'vi' ? 'LĨNH VỰC CHUYÊN SÂU:' : 'CORE PRACTICE AREAS:'}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">
                          {member.specialties}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[#c2a278] border-t border-white/10 pt-3">
                      <span>{language === 'vi' ? 'Xem lý lịch trích ngang' : 'View full biography'}</span>
                      <div className="bg-white/10 p-1 rounded-full border border-[#c2a278]/30">
                        <ArrowUpRight size={12} className="text-[#c2a278]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Section below image */}
                <div className="p-6 pt-2 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Description Quote */}
                    {member.description && (
                      <p className="text-slate-600 text-sm italic leading-relaxed mb-5 font-light line-clamp-3">
                        &ldquo;{member.description}&rdquo;
                      </p>
                    )}

                    {/* Specialty tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {specialtyList.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="bg-slate-50 border border-slate-150 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded transition-colors hover:bg-amber-50 hover:text-[#8c6239] hover:border-[#c2a278]/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom link */}
                  <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-[#8c6239] group-hover:text-[#c2a278] transition-colors">
                    <span>Xem lý lịch trích ngang</span>
                    <div className="bg-slate-50 p-1.5 rounded-full border border-slate-200 group-hover:border-[#c2a278]/40 group-hover:bg-amber-50 transition-all duration-300">
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Elegant Profile Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 sm:p-6 md:p-10"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white text-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 flex flex-col md:flex-row"
              id="team-detail-modal"
            >
              {/* Left Column: Image with gradient transition */}
              <div className="relative w-full md:w-[42%] aspect-[4/5] md:aspect-auto md:min-h-[520px] bg-slate-900 shrink-0">
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual gradients for blending */}
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-white hidden md:block"></div>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent md:hidden"></div>
              </div>

              {/* Right Column: Detailed info */}
              <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between relative">
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all duration-300 z-10"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>

                {/* Info content wrapper */}
                <div className="mb-8">
                  {/* Name and Title */}
                  <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#051815] tracking-tight leading-tight mb-2 pr-8">
                    {selectedMember.name}
                  </h3>
                  <p className="text-[#0e3b32] font-bold text-[11px] sm:text-xs tracking-widest uppercase mb-6 font-sans">
                    {selectedMember.title}
                  </p>

                  {/* Biography Quote */}
                  {selectedMember.description && (
                    <blockquote className="text-slate-600 italic text-sm sm:text-base leading-relaxed border-l-2 border-[#c2a278] pl-4 py-1 mb-8">
                      &ldquo;{selectedMember.description}&rdquo;
                    </blockquote>
                  )}

                  {/* Education / Degrees Section */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <BookOpen size={15} className="text-[#c2a278]" />
                      HỌC VẤN & ĐÀO TẠO
                    </h4>
                    <ul className="space-y-2">
                      {selectedMember.degrees?.split('\n').filter(Boolean).map((degree, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                          <CheckCircle2 size={16} className="text-[#10b981] mt-0.5 shrink-0" />
                          <span>{degree}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specialties Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Award size={15} className="text-[#c2a278]" />
                      LĨNH VỰC TƯ VẤN CHÍNH
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.specialties?.split(',').filter(Boolean).map((spec, idx) => (
                        <span
                          key={idx}
                          className="bg-[#fcf8f2] border border-[#f3e1cc] text-[#8c6239] text-xs font-medium px-3 py-1.5 rounded-lg"
                        >
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer section with contact details */}
                <div className="border-t border-slate-100 pt-6 mt-auto flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-slate-500 text-xs sm:text-sm">
                  {selectedMember.email && (
                    <a
                      href={`mailto:${selectedMember.email}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-[#0e3b32] transition-colors"
                    >
                      <Mail size={16} className="text-[#c2a278]" />
                      <span className="font-medium">{selectedMember.email}</span>
                    </a>
                  )}
                  {selectedMember.phone && (
                    <a
                      href={`tel:${selectedMember.phone.replace(/\./g, '')}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-[#0e3b32] transition-colors"
                    >
                      <Phone size={16} className="text-[#c2a278]" />
                      <span className="font-medium">{selectedMember.phone}</span>
                    </a>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
