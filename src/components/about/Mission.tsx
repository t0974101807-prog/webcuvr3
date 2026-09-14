import { Lightbulb, Users, Award, Shield } from 'lucide-react';

export default function Mission() {
  return (
    <div className="prose prose-lg text-gray-600">
      <h4 className="flex items-center gap-3 text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
        <Lightbulb className="text-[var(--color-accent)]" />
        2. Sứ mệnh (Mission)
      </h4>
      <p className="font-medium text-[var(--color-text-dark)] mb-4">
        "Chiếu sáng lộ trình pháp lý – Bảo vệ giá trị thịnh vượng."
      </p>
      <ul className="space-y-4 list-none pl-0">
        <li className="flex gap-4">
          <div className="mt-1 min-w-6">
            <Users size={20} className="text-[var(--color-accent)]" />
          </div>
          <span className="text-base font-light">
            <strong className="text-[var(--color-text-dark)] font-medium">Đối với Khách hàng:</strong> Cung cấp các giải pháp pháp lý toàn diện, minh bạch và tối ưu hóa lợi ích. 
            Chúng tôi đóng vai trò là "người gác cổng" tận tâm, giúp khách hàng hóa giải rủi ro, vững tâm kiến tạo những giá trị mới.
          </span>
        </li>
        <li className="flex gap-4">
          <div className="mt-1 min-w-6">
            <Award size={20} className="text-[var(--color-accent)]" />
          </div>
          <span className="text-base font-light">
            <strong className="text-[var(--color-text-dark)] font-medium">Đối với Đội ngũ:</strong> Xây dựng môi trường hành nghề luật chuyên nghiệp, 
            nơi trí tuệ được tôn trọng và đạo đức nghề nghiệp là kim chỉ nam cho mọi hành động.
          </span>
        </li>
        <li className="flex gap-4">
          <div className="mt-1 min-w-6">
            <Shield size={20} className="text-[var(--color-accent)]" />
          </div>
          <span className="text-base font-light">
            <strong className="text-[var(--color-text-dark)] font-medium">Đối với Xã hội:</strong> Thượng tôn pháp luật, góp phần xây dựng một môi trường 
            kinh doanh công bằng, minh bạch và thượng tôn công lý tại Việt Nam.
          </span>
        </li>
      </ul>
    </div>
  );
}
