import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Briefcase, MapPin, Clock, Coins, ArrowRight, Heart, Users, Award, Loader2 } from 'lucide-react';
import { navigateTo, fetchApi } from '../utils/api';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function RecruitmentTeaser() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadJobs = async () => {
      setLoading(true);
      let loadedJobs: any[] = [];

      // 1. Fetch directly from Firestore 'recruitment' collection
      try {
        const querySnap = await getDocs(collection(db, 'recruitment'));
        if (!querySnap.empty) {
          querySnap.forEach((doc) => {
            const data = doc.data();
            loadedJobs.push({
              id: doc.id,
              title: data.title,
              location: data.location,
              type: data.type || "Toàn thời gian",
              salary: data.salary || "Thỏa thuận",
              description: data.description || ""
            });
          });
        }
      } catch (err) {
        console.warn("Firestore recruitment fetch attempt:", err);
      }

      // 2. If Firestore is empty or errored, fetch from API endpoint
      if (loadedJobs.length === 0) {
        try {
          const res = await fetchApi(`/api/recruitment?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              loadedJobs = data;
            }
          }
        } catch (err) {
          console.error('Failed to fetch recruitment positions for teaser', err);
        }
      }

      if (isMounted) {
        setJobs(loadedJobs);
        setLoading(false);
      }
    };

    loadJobs();
    return () => { isMounted = false; };
  }, []);

  const displayJobs = jobs.slice(0, 2);
  return (
    <section id="recruitment-teaser" className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.25em] mb-4 text-xs sm:text-sm">
            Cơ hội nghề nghiệp
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight">
            Gia Nhập Đội Ngũ Ánh Dương Law
          </h3>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Chúng tôi luôn chào đón những nhân tố tài năng, chính trực và khát khao khẳng định giá trị bản thân trong một môi trường hành nghề luật chuyên nghiệp hàng đầu Việt Nam.
          </p>
        </div>

        {/* Perks overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <div className="flex gap-4 items-start p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Môi trường chuyên nghiệp</h4>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
                Làm việc trực tiếp cùng các Luật sư gạo cội và tham gia xử lý các hồ sơ pháp lý thực chiến hàng đầu.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Coins size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Đãi ngộ xứng đáng</h4>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
                Mức lương cứng cạnh tranh, thưởng vụ việc hấp dẫn, thưởng hiệu quả theo dự án rõ ràng, minh bạch.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Lộ trình thăng tiến rõ ràng</h4>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
                Kế hoạch phát triển cá nhân chi tiết, đào tạo định kỳ giúp bạn nhanh chóng nâng cao chứng chỉ hành nghề.
              </p>
            </div>
          </div>
        </div>

        {/* Featured positions */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 justify-center">
            <Briefcase size={18} className="text-[var(--color-accent)]" />
            Vị trí tuyển dụng nổi bật
          </h4>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
            </div>
          ) : displayJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Hiện chưa có vị trí tuyển dụng mới. Vui lòng quay lại sau!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigateTo('/tuyen-dung')}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-300 group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {job.type}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 font-semibold">
                        <MapPin size={12} className="text-red-400" /> {job.location}
                      </span>
                    </div>
                    <h5 className="text-lg font-serif font-bold text-slate-800 mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                      {job.title}
                    </h5>
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
                      {job.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Coins size={12} /> {job.salary}
                    </span>
                    <span className="text-[var(--color-primary)] font-bold group-hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
                      Xem chi tiết <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Call to Action Button */}
          <div className="text-center pt-8">
            <button
              onClick={() => navigateTo('/tuyen-dung')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <span>Xem tất cả vị trí tuyển dụng</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
