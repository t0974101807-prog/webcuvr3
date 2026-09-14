import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';
import { fetchApi, navigateTo } from '../utils/api';
import { useContactSettings } from '../hooks/useContactSettings';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const INITIAL_FALLBACK_BRANCHES = [
  {
    id: 'hcm',
    name: "Trụ sở chính TP. Hồ Chí Minh",
    shortName: "Hồ Chí Minh",
    address: "Lầu 8, Tòa nhà số 520 Cách Mạng Tháng Tám, Phường 11, Quận 3, TP. Hồ Chí Minh",
    phone: "1900 3330",
    provinceName: "TP. Hồ Chí Minh",
    googleMapsUrl: "https://maps.google.com/?q=520+Cach+Mang+Thang+Tam+Quan+3+TP+HCM",
    position: [10.784206, 106.666993] as [number, number]
  },
  {
    id: 'hn',
    name: "Chi nhánh Hà Nội",
    shortName: "Hà Nội",
    address: "Tầng 13, Toà nhà MD Complex, Số 68 Nguyễn Cơ Thạch, KĐT Mỹ Đình 1, Phường Cầu Diễn, Quận Nam Từ Liêm, Hà Nội",
    phone: "1900 3330",
    provinceName: "Hà Nội",
    googleMapsUrl: "https://maps.google.com/?q=68+Nguyen+Co+Thach+Nam+Tu+Liem+Ha+Noi",
    position: [21.029851, 105.766173] as [number, number]
  },
  {
    id: 'dn',
    name: "Chi nhánh Đà Nẵng",
    shortName: "Đà Nẵng",
    address: "Tầng 3, Số 229 Lê Duẩn, Phường Tân Chính, Quận Thanh Khê, TP. Đà Nẵng",
    phone: "1900 3330",
    provinceName: "Đà Nẵng",
    googleMapsUrl: "https://maps.google.com/?q=229+Le+Duan+Thanh+Khe+Da+Nang",
    position: [16.069154, 108.214064] as [number, number]
  }
];

const VIETNAM_PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai", "Cần Thơ", "Hải Phòng", "Bà Rịa - Vũng Tàu"
];

export default function ContactTeaser() {
  const { settings } = useContactSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    province: 'TP. Hồ Chí Minh',
    interest: '',
    message: ''
  });

  const [branches, setBranches] = useState<any[]>(INITIAL_FALLBACK_BRANCHES);
  const [activeBranchId, setActiveBranchId] = useState('hcm');
  const activeBranch = branches.find(b => b.id.toString() === activeBranchId.toString()) || branches[0] || INITIAL_FALLBACK_BRANCHES[0];

  const getGoogleMapsDirectionUrl = (branch: any) => {
    if (!branch) return '#';
    const lat = branch.position?.[0];
    const lng = branch.position?.[1];
    if (lat && lng && lat !== 10.784206 && lng !== 106.666993) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    if (branch.googleMapsUrl && branch.googleMapsUrl.startsWith('http')) {
      return branch.googleMapsUrl;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((branch.address || '') + ', ' + (branch.name || ''))}`;
  };

  useEffect(() => {
    const loadOffices = async () => {
      let loaded = false;
      // 1. Try Firestore direct collection load
      try {
        const querySnap = await getDocs(collection(db, 'offices'));
        if (!querySnap.empty) {
          const fsData: any[] = [];
          querySnap.forEach((doc) => {
            const data = doc.data();
            fsData.push({
              id: doc.id,
              name: data.name || data.title,
              shortName: data.short_name || data.name || data.title,
              address: data.address,
              phone: data.phone || '1900 3330',
              provinceName: data.provinceName || data.short_name || data.name,
              googleMapsUrl: data.map_url || data.googleMapsUrl || '',
              position: [data.latitude || 10.784206, data.longitude || 106.666993] as [number, number],
              is_headquarters: data.is_headquarters
            });
          });
          if (fsData.length > 0) {
            setBranches(fsData);
            const hq = fsData.find((o: any) => o.is_headquarters);
            if (hq) {
              setActiveBranchId(hq.id.toString());
            } else {
              setActiveBranchId(fsData[0].id.toString());
            }
            loaded = true;
          }
        }
      } catch (err) {
        console.warn("Firestore offices fetch attempt:", err);
      }

      if (!loaded) {
        // 2. Fallback / complement with backend API
        try {
          const response = await fetchApi('/api/offices');
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              const mapped = data.map((o: any) => ({
                id: o.id.toString(),
                name: o.name,
                shortName: o.short_name || o.name,
                address: o.address,
                phone: o.phone,
                provinceName: o.short_name || o.name,
                googleMapsUrl: o.map_url || '',
                position: [o.latitude || 10.784206, o.longitude || 106.666993] as [number, number]
              }));
              setBranches(mapped);
              const hq = data.find((o: any) => o.is_headquarters);
              if (hq) {
                setActiveBranchId(hq.id.toString());
              } else {
                setActiveBranchId(mapped[0].id);
              }
            }
          }
        } catch (err) {
          console.error("Error loading offices in teaser:", err);
        }
      }
    };
    loadOffices();
  }, []);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [inView, setInView] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Trigger Leaflet loading when the container is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!inView) return;

    // Set default marker icon config
    const DefaultIcon = L.icon({
      iconUrl: icon,
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: activeBranch.position,
        zoom: 15,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add all branch markers
      branches.forEach(branch => {
        const marker = L.marker(branch.position).addTo(map);
        
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 min-w-[200px]';
        popupContent.innerHTML = `
          <h5 class="font-bold text-[#0F172A] mb-1 text-sm">${branch.name}</h5>
          <p class="text-xs text-gray-600">${branch.address}</p>
        `;
        marker.bindPopup(popupContent);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [inView, branches]);

  // Fly to active branch location when selection changes
  useEffect(() => {
    if (mapInstanceRef.current && activeBranch) {
      mapInstanceRef.current.flyTo(activeBranch.position, 15, {
        duration: 1.5
      });
    }
  }, [activeBranchId, activeBranch]);

  const handleBranchSelect = (id: string) => {
    setActiveBranchId(id);
    const branch = branches.find(b => b.id.toString() === id.toString());
    if (branch) {
      setFormData(prev => ({
        ...prev,
        province: branch.provinceName
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    // Sync active branch tab if user changes province manually in dropdown
    if (id === 'province') {
      const matchedBranch = branches.find(b => b.provinceName === value);
      if (matchedBranch) {
        setActiveBranchId(matchedBranch.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        content: `[LIÊN HỆ NHANH TRANG CHỦ - Địa bàn: ${formData.province}]\nLĩnh vực cần tư vấn: ${formData.interest || 'Chưa chọn'}\nNội dung chi tiết:\n${formData.message}`,
        file_url: null,
        file_name: null
      };

      // Sync to Firestore directly
      try {
        await addDoc(collection(db, 'messages'), {
          ...payload,
          created_at: new Date().toISOString(),
          is_read: 0,
          source: 'contact_teaser'
        });
      } catch (fsErr) {
        console.warn('Direct Firestore message add error:', fsErr);
      }

      const response = await fetchApi('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          phone: '',
          email: '',
          province: 'TP. Hồ Chí Minh',
          interest: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting contact teaser form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-[#FAF9F6] relative overflow-hidden scroll-mt-20">
      {/* Scroll anchor for network links */}
      <div id="network" className="absolute top-0 left-0" />

      {/* Decorative background vectors */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.25em] mb-4 text-xs sm:text-sm">
            Hệ thống chi nhánh & Liên hệ
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight">
            Kết Nối Nhanh Với Luật Sư
          </h3>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Chọn chi nhánh gần nhất để xem bản đồ chỉ đường chi tiết hoặc điền thông tin đăng ký tư vấn nhanh trực tuyến bên dưới.
          </p>
        </div>

        {/* Hotlines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Phone size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng đài tư vấn miễn phí</span>
              <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="text-lg font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors">{settings.hotline_consult}</a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Smartphone size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hotline Kế Toán Thuế</span>
              <a href={`tel:${settings.hotline_accounting.replace(/\s+/g, '')}`} className="text-lg font-bold text-emerald-600 hover:opacity-80 transition-opacity">{settings.hotline_accounting}</a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email liên hệ nhanh</span>
              <a href={`mailto:${settings.email}`} className="text-base font-bold text-slate-700 hover:text-[var(--color-primary)] transition-colors break-all">{settings.email}</a>
            </div>
          </div>
        </div>

        {/* Content Split: Interactive Map & Advisory Request Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* LEFT: Interactive Map & Branch Selector */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="font-serif font-bold text-lg sm:text-xl text-slate-800">
                  Mạng Lưới Văn Phòng Chiến Lược
                </h4>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Bản đồ tương tác
                </span>
              </div>

              {/* Branch switcher buttons */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => handleBranchSelect(branch.id)}
                    className={`py-2.5 px-1 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      activeBranchId.toString() === branch.id.toString()
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-[var(--color-primary)]'
                    }`}
                  >
                    {branch.shortName}
                  </button>
                ))}
              </div>

              {/* Leaflet map container */}
              <div className="relative w-full h-[260px] sm:h-[300px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 z-0">
                <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
              </div>

              {/* Active Branch Details */}
              <motion.div
                key={activeBranchId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-serif font-bold text-slate-800 text-sm sm:text-base">
                    {activeBranch.name}
                  </h5>
                  {activeBranch.id === 'hcm' && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-md uppercase">
                      Trụ sở chính
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                    <span>{activeBranch.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-[var(--color-accent)] shrink-0" />
                    <span className="font-semibold">{activeBranch.phone}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-semibold tracking-wide uppercase text-[10px]">
                Hệ thống {branches.length} chi nhánh toàn quốc
              </span>
              <a
                href={getGoogleMapsDirectionUrl(activeBranch)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
              >
                Chỉ đường trên Google Maps <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* RIGHT: advisory Request Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 flex flex-col justify-center">
            <div className="mb-6">
              <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Đăng Ký Tư Vấn Nhanh</h4>
              <p className="text-slate-500 text-xs sm:text-sm">
                Vui lòng điền thông tin bên dưới để các Luật sư và Chuyên viên pháp lý liên hệ hỗ trợ bạn nhanh chóng nhất.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {submitStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle size={32} className="stroke-[3px]" />
                  </div>
                  <div>
                    <h5 className="text-xl font-bold text-slate-800">Gửi Thành Công!</h5>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                      Thông tin tư vấn đã được gửi đi. Luật sư phụ trách sẽ gọi lại cho bạn trong vòng 15 phút tới.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Gửi yêu cầu khác
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <input
                        type="text"
                        required
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Họ và tên quý khách *"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-xs sm:text-sm transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Số điện thoại *"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-xs sm:text-sm transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Địa chỉ Email"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-xs sm:text-sm transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <select
                        id="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-xs sm:text-sm transition-all text-slate-700 cursor-pointer appearance-none font-medium"
                      >
                        {VIETNAM_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <select
                      id="interest"
                      required
                      value={formData.interest}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-xs sm:text-sm transition-all text-slate-700 cursor-pointer appearance-none font-medium"
                    >
                      <option value="">-- Lĩnh vực cần hỗ trợ * --</option>
                      <option value="Doanh nghiệp, Đầu tư">Doanh nghiệp & Đầu tư</option>
                      <option value="Kế toán, Thuế">Kế toán & Quyết toán Thuế</option>
                      <option value="Giấy phép con">Hồ sơ Giấy phép con (ATVSTP,...)</option>
                      <option value="Đất đai, Nhà đất">Thủ tục Đất đai & Bất động sản</option>
                      <option value="Hôn nhân, Gia đình, Dân sự">Hôn nhân & Hợp đồng Dân sự</option>
                      <option value="Hình sự, Tranh tụng">Tranh tụng Hình sự tại Tòa</option>
                      <option value="Khác">Lĩnh vực pháp lý khác</option>
                    </select>
                  </div>

                  <div>
                    <textarea
                      id="message"
                      required
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Nội dung cần tư vấn tóm tắt *..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-xs sm:text-sm transition-all resize-none text-slate-800 leading-relaxed font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi yêu cầu tư vấn ngay
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
