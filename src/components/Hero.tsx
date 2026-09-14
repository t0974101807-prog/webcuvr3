import { motion } from 'motion/react';
import { Link as ScrollLink } from 'react-scroll';
const Link = ScrollLink as any;
import { useContactSettings, defaultContactSettings } from '../hooks/useContactSettings';
import { useLanguage } from '../hooks/useLanguage';

export default function Hero() {
  const { settings } = useContactSettings();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const subTitle = isEn
    ? (settings.hero_subtitle === defaultContactSettings.hero_subtitle
        ? "Anh Duong Law Firm Co., Ltd"
        : settings.hero_subtitle)
    : settings.hero_subtitle;

  const title1 = isEn
    ? (settings.hero_title_1 === defaultContactSettings.hero_title_1
        ? "Solid Foundations"
        : settings.hero_title_1)
    : settings.hero_title_1;

  const title2 = isEn
    ? (settings.hero_title_2 === defaultContactSettings.hero_title_2
        ? "Bright Future"
        : settings.hero_title_2)
    : settings.hero_title_2;

  const description = isEn
    ? (settings.hero_description === defaultContactSettings.hero_description
        ? "Architecting comprehensive, elite, and dedicated legal solutions. A trusted partner for sustainable prosperity."
        : settings.hero_description)
    : settings.hero_description;

  // Stagger animation container and items
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.1,
      }
    }
  };

  const eyebrowVariants = {
    hidden: { opacity: 0, y: 25, letterSpacing: "0.4em" },
    visible: {
      opacity: 1,
      y: 0,
      letterSpacing: "0.2em",
      transition: {
        duration: 1.0,
        ease: "easeOut" as any,
      }
    }
  };

  const headlineVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: "easeOut" as any,
      }
    }
  };

  const descriptionVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as any,
      }
    }
  };

  const buttonGroupVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as any,
      }
    }
  };

  return (
    <section id="hero" className="relative min-h-[100dvh] w-full overflow-hidden flex items-center justify-center pt-28 sm:pt-32 pb-12">
      {/* Background Image with Sophisticated Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="w-full h-full"
        >
          <img
            src={settings.hero_image_url || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=60&w=1280&auto=format&fit=crop"}
            alt="Hero Banner"
            className="w-full h-full object-cover"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>
        <div className="absolute inset-0 bg-[var(--color-primary)]/20 mix-blend-overlay"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={eyebrowVariants}
            className="inline-block py-2 px-6 border-t border-b border-[var(--color-accent)] text-white/90 text-sm md:text-base uppercase mb-8 backdrop-blur-sm font-medium"
          >
            {subTitle}
          </motion.div>
          
          <motion.h1 
            variants={headlineVariants}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 md:mb-8 leading-tight tracking-tight drop-shadow-md"
          >
            {title1} <br />
            <span className="text-[var(--color-accent)]">
              {title2}
            </span>
          </motion.h1>
          
          <motion.p 
            variants={descriptionVariants}
            className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 md:mb-12 font-light leading-relaxed tracking-wide px-4"
          >
            {description}
          </motion.p>
          
          <motion.div 
            variants={buttonGroupVariants}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-4 sm:px-0"
          >
            <Link
              to="contact"
              smooth={true}
              duration={700}
              className="group relative w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 bg-[var(--color-accent)] active:scale-95 text-white font-medium rounded-full overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all cursor-pointer text-center"
            >
              <span className="relative z-10 tracking-wider text-sm uppercase">{t('hero.contact_btn', "Liên hệ ngay")}</span>
              <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
            </Link>
            
            <Link
              to="services"
              smooth={true}
              duration={700}
              className="group w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 bg-transparent active:scale-95 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm text-center"
            >
              <span className="tracking-wider text-sm uppercase">{t('hero.services_btn', "Dịch vụ")}</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Elegant Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 100 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-[1px] bg-gradient-to-b from-transparent via-white/50 to-white"
      ></motion.div>
    </section>
  );
}
