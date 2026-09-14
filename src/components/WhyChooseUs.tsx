import { motion } from 'motion/react';
import { Heart, Shield, TrendingUp, Briefcase, CheckCircle2 } from 'lucide-react';

export default function WhyChooseUs() {
  const reasons = [
    {
      icon: Briefcase,
      title: 'Đội ngũ Luật sư giỏi',
      description: 'Đội ngũ luật sư giàu kinh nghiệm, chuyên môn cao, từng giải quyết thành công nhiều vụ việc phức tạp.'
    },
    {
      icon: TrendingUp,
      title: 'Chi phí hợp lý',
      description: 'Cam kết chi phí minh bạch, cạnh tranh và phù hợp với chất lượng dịch vụ cung cấp.'
    },
    {
      icon: Heart,
      title: 'Tận tâm',
      description: 'Luôn đặt lợi ích của khách hàng lên hàng đầu, lắng nghe và đồng hành cùng khách hàng trong mọi giai đoạn.'
    },
    {
      icon: Shield,
      title: 'Bảo mật',
      description: 'Cam kết bảo mật tuyệt đối thông tin khách hàng và vụ việc theo quy định của pháp luật và đạo đức nghề nghiệp.'
    }
  ];

  return (
    <section id="why-choose-us" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm">
            Giá Trị Khác Biệt
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight">
            Vì Sao Chọn Ánh Dương Law?
          </h3>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Chúng tôi cam kết mang lại giá trị thực sự cho khách hàng thông qua sự chuyên nghiệp và tận tâm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-6 mx-auto">
                  <Icon size={28} />
                </div>
                
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-dark)] mb-3">
                  {reason.title}
                </h4>
                
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {reason.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
