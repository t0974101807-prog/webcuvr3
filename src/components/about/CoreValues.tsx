import { Heart } from 'lucide-react';

export default function CoreValues() {
  return (
    <div>
      <h4 className="flex items-center gap-3 text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
        <Heart className="text-[var(--color-accent)]" />
        3. Giá trị cốt lõi (Core Values)
      </h4>
      <p className="text-gray-600 italic mb-6 text-base">
        Để thực hiện tầm nhìn và sứ mệnh đó, Ánh Dương Law vận hành dựa trên 4 trụ cột giá trị:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg border-t-4 border-[var(--color-primary)] hover:shadow-lg transition-shadow">
          <h5 className="text-xl font-bold text-[var(--color-primary)] mb-3">TRÍ</h5>
          <p className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-3">Intellectual Capital</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Lấy tư duy sắc bén và kiến thức chuyên môn sâu rộng làm công cụ sắc bén nhất để thực thi công lý.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border-t-4 border-[var(--color-accent)] hover:shadow-lg transition-shadow">
          <h5 className="text-xl font-bold text-[var(--color-primary)] mb-3">TÍN</h5>
          <p className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-3">Integrity</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Sự minh bạch và trung thực là "vàng mười" trong mọi mối quan hệ. Chúng tôi coi chữ Tín là tài sản lớn nhất của thương hiệu.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border-t-4 border-[var(--color-primary)] hover:shadow-lg transition-shadow">
          <h5 className="text-xl font-bold text-[var(--color-primary)] mb-3">TÂM</h5>
          <p className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-3">Dedication</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Đặt lợi ích hợp pháp của khách hàng lên hàng đầu. Mọi vụ việc không chỉ là hồ sơ, đó là sự kỳ vọng và niềm tin.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border-t-4 border-[var(--color-accent)] hover:shadow-lg transition-shadow">
          <h5 className="text-xl font-bold text-[var(--color-primary)] mb-3">TỐI ƯU</h5>
          <p className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-3">Efficiency</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Không chỉ đưa ra lời khuyên đúng luật, chúng tôi đưa ra giải pháp thực tiễn nhất, tiết kiệm thời gian và nguồn lực cho khách hàng.
          </p>
        </div>
      </div>
    </div>
  );
}
