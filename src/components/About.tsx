import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import AboutHeader from './about/AboutHeader';
import Vision from './about/Vision';
import Mission from './about/Mission';
import CoreValues from './about/CoreValues';
import AboutModal from './AboutModal';
import { useContactSettings } from '../hooks/useContactSettings';
import { fetchApi } from '../utils/api';

export default function About() {
  const { settings } = useContactSettings();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('overview');

  useEffect(() => {
    const handleOpenAbout = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      const tab = customEvent.detail?.tab || 'overview';
      setModalTab(tab);
      setIsModalOpen(true);
    };

    window.addEventListener('open-about-modal', handleOpenAbout);
    return () => window.removeEventListener('open-about-modal', handleOpenAbout);
  }, []);

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Image Section - Editorial Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-5 relative lg:sticky lg:top-32"
          >
            <div className="relative z-10 overflow-hidden rounded-lg shadow-2xl">
              <motion.img
                style={{ y }}
                src={settings.about_image_url || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=60&w=800&auto=format&fit=crop"}
                alt="Modern Law Office"
                className="w-full aspect-[4/3] lg:aspect-[3/4] object-cover hover:scale-105 transition-transform duration-1000"
                loading="lazy"
              />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-2/3 h-2/3 border border-[var(--color-primary)]/20 z-0"></div>
            <div className="absolute -bottom-10 -right-10 w-2/3 h-2/3 bg-[var(--color-secondary)]/50 z-0"></div>
            
            <div className="absolute bottom-4 right-4 md:bottom-10 md:right-0 bg-white p-6 md:p-8 shadow-xl z-20 max-w-[200px] md:max-w-xs border-l-4 border-[var(--color-accent)]">
              <p className="font-serif text-3xl md:text-5xl font-bold text-[var(--color-primary)] mb-1 md:mb-2">
                {settings.about_years_exp || "15+"}
              </p>
              <p className="text-gray-600 text-xs md:text-sm font-medium uppercase tracking-wider">
                {settings.about_years_label || "NĂM KINH NGHIỆM VỮNG CHẮC"}
              </p>
            </div>
          </motion.div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-7 pl-0 lg:pl-10 space-y-12"
          >
            {/* Header */}
            <AboutHeader />
            
            {/* 1. Vision */}
            <Vision />

            {/* 2. Mission */}
            <Mission />
          </motion.div>
        </div>

        {/* Full-width content below the grid */}
        <div className="mt-20 space-y-12 lg:space-y-16">
          {/* 3. Core Values */}
          <CoreValues />

          {/* Quote */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative py-12 px-8 max-w-4xl mx-auto bg-[var(--color-primary)] text-white rounded-lg shadow-lg"
          >
            <div className="absolute top-4 left-4 text-[var(--color-accent)] opacity-50 text-6xl font-serif leading-none">"</div>
            <p className="text-lg md:text-2xl font-serif italic text-center relative z-10 leading-relaxed px-4 md:px-8">
              Tại Ánh Dương Law, pháp lý không chỉ là những dòng điều luật khô khan, đó là ánh sáng dẫn lối để mỗi bước đi của bạn trên hành trình kinh doanh và đời sống đều nằm trong hành lang an toàn nhất.
            </p>
            <div className="absolute bottom-4 right-4 text-[var(--color-accent)] opacity-50 text-6xl font-serif leading-none rotate-180">"</div>
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-6 pt-8"
          >
            <button 
              onClick={() => {
                setModalTab('overview');
                setIsModalOpen(true);
              }}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-light)] transition-all duration-300 active:scale-95 shadow-md cursor-pointer"
            >
              <span>Hồ sơ năng lực</span>
              <div className="w-8 h-[1px] bg-white group-hover:w-12 transition-all"></div>
            </button>

            <button 
              onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex items-center justify-center gap-3 px-8 py-4 border border-[var(--color-primary)] text-[var(--color-primary)] font-medium rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 active:scale-95 bg-white shadow-sm cursor-pointer"
            >
              <span>Đội ngũ luật sư</span>
              <div className="w-8 h-[1px] bg-[var(--color-primary)] group-hover:bg-white group-hover:w-12 transition-all"></div>
            </button>
          </motion.div>
        </div>
      </div>

      <AboutModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialTab={modalTab} 
      />
    </section>
  );
}
