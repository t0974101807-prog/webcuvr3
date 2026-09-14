export default function AboutHeader() {
  return (
    <div>
      <h2 className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm">
        Về Chúng Tôi
      </h2>
      <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight">
        CÔNG TY LUẬT TNHH <br/>
        <span className="text-[var(--color-primary)]">ÁNH DƯƠNG</span>
      </h3>
      <p className="text-xl font-serif italic text-gray-600 border-l-4 border-[var(--color-accent)] pl-6 py-2">
        "Ánh Dương Law – Trí tuệ dẫn lối, Pháp lý thực thi"
      </p>
    </div>
  );
}
