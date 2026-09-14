import { Target } from 'lucide-react';

export default function Vision() {
  return (
    <div className="prose prose-lg text-gray-600">
      <h4 className="flex items-center gap-3 text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
        <Target className="text-[var(--color-accent)]" />
        1. Tầm nhìn (Vision)
      </h4>
      <p className="font-medium text-[var(--color-text-dark)] mb-2">
        "Trở thành định chế pháp lý biểu tượng cho sự Tin cậy và Sáng tạo."
      </p>
      <p className="leading-relaxed font-light text-base">
        Ánh Dương Law định hướng xác lập vị thế là một trong những tổ chức hành nghề Luật sư hàng đầu tại Việt Nam, 
        tiên phong trong việc kết hợp giữa <strong className="text-[var(--color-primary)]">nền tảng pháp lý vững chắc và tư duy giải pháp hiện đại</strong>. 
        Chúng tôi không chỉ giải quyết các vấn đề hiện hữu mà còn đón đầu các xu hướng biến động của thị trường, 
        trở thành đối tác chiến lược không thể thiếu trong lộ trình phát triển bền vững của khách hàng.
      </p>
    </div>
  );
}
