import { useEffect } from 'react';

export default function SchemaMarkup() {
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LegalService",
          "@id": "https://anhduonglaw.vn/#organization",
          "name": "Công ty Luật TNHH Ánh Dương",
          "url": "https://anhduonglaw.vn/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://anhduonglaw.vn/logo.svg"
          },
          "image": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=60&w=1280&auto=format&fit=crop",
          "description": "Kiến tạo giải pháp pháp lý toàn diện, đẳng cấp và tận tâm. Đối tác tin cậy cho sự thịnh vượng bền vững.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "01 Bùi Giáng, Thịnh Mỹ, Hội An Tây",
            "addressLocality": "Đà Nẵng",
            "addressCountry": "VN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 16.0544,
            "longitude": 108.2022
          },
          "telephone": "0866.857.217",
          "email": "info@anhduonglaw.vn",
          "priceRange": "$$",
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ],
            "opens": "07:30",
            "closes": "17:00"
          },
          "sameAs": [
            "https://www.facebook.com/anhduonglaw",
            "https://www.linkedin.com/company/anhduonglaw"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://anhduonglaw.vn/#website",
          "url": "https://anhduonglaw.vn/",
          "name": "Công ty Luật TNHH Ánh Dương",
          "description": "Giải pháp pháp lý toàn diện cho doanh nghiệp và cá nhân",
          "publisher": {
            "@id": "https://anhduonglaw.vn/#organization"
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
