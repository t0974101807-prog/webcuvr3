import { useState, useEffect } from "react";
import { fetchApi } from "../utils/api";
import { io } from "socket.io-client";

export interface ContactSettings {
  hotline_consult: string;
  hotline_accounting: string;
  hotline_feedback: string;
  email: string;
  facebook_url?: string;
  messenger_url?: string;
  zalo_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  logo_url?: string;
  logo_cms_url?: string;
  logo_portal_url?: string;
  hero_image_url?: string;
  hero_subtitle?: string;
  hero_title_1?: string;
  hero_title_2?: string;
  hero_description?: string;
  about_image_url?: string;
  about_years_exp?: string;
  about_years_label?: string;
  about_vision_title?: string;
  about_vision_text?: string;
  about_mission_title?: string;
  about_mission_text?: string;
}

export const defaultContactSettings: ContactSettings = {
  hotline_consult: "1900 3330",
  hotline_accounting: "084.696.7979",
  hotline_feedback: "090.999.3330",
  email: "info@anhduonglaw.vn",
  facebook_url: "https://facebook.com/anhduonglaw.vn",
  messenger_url: "https://m.me/anhduonglaw.vn",
  zalo_url: "https://zalo.me/0846967979",
  youtube_url: "https://youtube.com/@anhduonglaw",
  tiktok_url: "https://tiktok.com/@anhduonglaw",
  instagram_url: "https://instagram.com/anhduonglaw",
  twitter_url: "https://x.com/anhduonglaw",
  linkedin_url: "https://linkedin.com/company/anhduonglaw",
  logo_url: "/logo.svg",
  logo_cms_url: "/logo.svg",
  logo_portal_url: "/logo.svg",
  hero_image_url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=60&w=1280&auto=format&fit=crop",
  hero_subtitle: "Công ty Luật TNHH Ánh Dương",
  hero_title_1: "Vững Pháp Lý",
  hero_title_2: "Sáng Tương Lai",
  hero_description: "Kiến tạo giải pháp pháp lý toàn diện, đẳng cấp và tận tâm. Đối tác tin cậy cho sự thịnh vượng bền vững.",
  about_image_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=60&w=800&auto=format&fit=crop",
  about_years_exp: "15+",
  about_years_label: "NĂM KINH NGHIỆM VỮNG CHẮC",
  about_vision_title: "1. Tầm nhìn (Vision)",
  about_vision_text: '"Trở thành định chế pháp lý biểu tượng cho sự Tin cậy và Sáng tạo."',
  about_mission_title: "2. Sứ mệnh (Mission)",
  about_mission_text: '"Chiếu sáng lộ trình pháp lý - Bảo vệ giá trị thịnh vượng."',
};

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettings>(defaultContactSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await fetchApi("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const activeLogo = data.logo_url || defaultContactSettings.logo_url;
        if (activeLogo === "/logo.svg") {
          try { localStorage.removeItem("lawfirm_custom_logo"); } catch (e) {}
        } else if (activeLogo) {
          try { localStorage.setItem("lawfirm_custom_logo", activeLogo); } catch (e) {}
        }
        // Merge with defaults to ensure all keys exist
        setSettings({
          hotline_consult: data.hotline_consult || defaultContactSettings.hotline_consult,
          hotline_accounting: data.hotline_accounting || defaultContactSettings.hotline_accounting,
          hotline_feedback: data.hotline_feedback || defaultContactSettings.hotline_feedback,
          email: data.email || defaultContactSettings.email,
          facebook_url: data.facebook_url || defaultContactSettings.facebook_url,
          messenger_url: data.messenger_url || defaultContactSettings.messenger_url,
          zalo_url: data.zalo_url || defaultContactSettings.zalo_url,
          youtube_url: data.youtube_url || defaultContactSettings.youtube_url,
          tiktok_url: data.tiktok_url || defaultContactSettings.tiktok_url,
          instagram_url: data.instagram_url || defaultContactSettings.instagram_url,
          twitter_url: data.twitter_url || defaultContactSettings.twitter_url,
          linkedin_url: data.linkedin_url || defaultContactSettings.linkedin_url,
          logo_url: activeLogo,
          logo_cms_url: data.logo_cms_url || defaultContactSettings.logo_cms_url,
          logo_portal_url: data.logo_portal_url || defaultContactSettings.logo_portal_url,
          hero_image_url: data.hero_image_url || defaultContactSettings.hero_image_url,
          hero_subtitle: data.hero_subtitle || defaultContactSettings.hero_subtitle,
          hero_title_1: data.hero_title_1 || defaultContactSettings.hero_title_1,
          hero_title_2: data.hero_title_2 || defaultContactSettings.hero_title_2,
          hero_description: data.hero_description || defaultContactSettings.hero_description,
          about_image_url: data.about_image_url || defaultContactSettings.about_image_url,
          about_years_exp: data.about_years_exp || defaultContactSettings.about_years_exp,
          about_years_label: data.about_years_label || defaultContactSettings.about_years_label,
          about_vision_title: data.about_vision_title || defaultContactSettings.about_vision_title,
          about_vision_text: data.about_vision_text || defaultContactSettings.about_vision_text,
          about_mission_title: data.about_mission_title || defaultContactSettings.about_mission_title,
          about_mission_text: data.about_mission_text || defaultContactSettings.about_mission_text,
        });
      }
    } catch (e) {
      console.error("Error fetching contact settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Listen for custom event to synchronize across different components
    const handleUpdate = () => {
      fetchSettings();
    };
    window.addEventListener("contact-settings-updated", handleUpdate);

    let s: any = null;
    try {
      s = io();
      s.on("settings_updated", handleUpdate);
      s.on("cms_updated", (data: any) => {
        if (data?.type === "settings") handleUpdate();
      });
    } catch (e) {}

    return () => {
      window.removeEventListener("contact-settings-updated", handleUpdate);
      if (s) s.disconnect();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<ContactSettings>) => {
    try {
      const res = await fetchApi("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        // Dispatch event to update other components in real-time
        window.dispatchEvent(new Event("contact-settings-updated"));
        return true;
      }
    } catch (e) {
      console.error("Error updating contact settings:", e);
    }
    return false;
  };

  return { settings, loading, updateSettings, refresh: fetchSettings };
}
