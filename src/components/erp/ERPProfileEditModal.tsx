import React from "react";
import { Award, X } from "lucide-react";

interface ERPProfileEditModalProps {
  showProfileEditModal: boolean;
  language: "vi" | "en";
  user: any;
  profileEditData: {
    name: string;
    title: string;
    avatar: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    address: string;
  };
  setProfileEditData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      title: string;
      avatar: string;
      phone: string;
      email: string;
      dob: string;
      gender: string;
      address: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ERPProfileEditModal({
  showProfileEditModal,
  language,
  user,
  profileEditData,
  setProfileEditData,
  onClose,
  onSubmit,
}: ERPProfileEditModalProps) {
  if (!showProfileEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-serif">
              {language === "vi" ? "Cập nhật Thông tin Cá nhân" : "Edit Profile"}
            </h3>
            <p className="text-xs opacity-80 mt-1">
              {language === "vi"
                ? "Thay đổi thông tin hồ sơ tài khoản của bạn"
                : "Manage your personal profile details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {language === "vi" ? "Họ và tên" : "Full Name"}
            </label>
            <input
              type="text"
              value={profileEditData.name}
              onChange={(e) =>
                setProfileEditData({ ...profileEditData, name: e.target.value })
              }
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {language === "vi" ? "Chức danh (Đi kèm tên hiển thị)" : "Job Title"}
            </label>
            <input
              type="text"
              value={profileEditData.title}
              onChange={(e) =>
                setProfileEditData({ ...profileEditData, title: e.target.value })
              }
              placeholder={
                language === "vi"
                  ? "VD: Luật sư điều hành, Luật sư cộng sự..."
                  : "e.g., Managing Partner, Associate..."
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {language === "vi" ? "Ảnh đại diện (Avatar URL)" : "Avatar URL"}
            </label>
            <input
              type="text"
              value={profileEditData.avatar}
              onChange={(e) =>
                setProfileEditData({ ...profileEditData, avatar: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium text-xs font-mono"
              placeholder="https://images.unsplash.com/..."
            />
            <div className="flex gap-2 mt-2">
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
              ].map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setProfileEditData({ ...profileEditData, avatar: url })
                  }
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                    profileEditData.avatar === url
                      ? "border-[var(--color-primary)] scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt="preset"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {language === "vi" ? "Số điện thoại" : "Phone"}
              </label>
              <input
                type="text"
                value={profileEditData.phone}
                onChange={(e) =>
                  setProfileEditData({ ...profileEditData, phone: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileEditData.email}
                onChange={(e) =>
                  setProfileEditData({ ...profileEditData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {language === "vi" ? "Ngày sinh" : "Date of Birth"}
              </label>
              <input
                type="date"
                value={profileEditData.dob}
                onChange={(e) =>
                  setProfileEditData({ ...profileEditData, dob: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {language === "vi" ? "Giới tính" : "Gender"}
              </label>
              <select
                value={profileEditData.gender}
                onChange={(e) =>
                  setProfileEditData({ ...profileEditData, gender: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium bg-white"
              >
                <option value="">
                  {language === "vi" ? "-- Chọn --" : "-- Select --"}
                </option>
                <option value="Nam">{language === "vi" ? "Nam" : "Male"}</option>
                <option value="Nữ">{language === "vi" ? "Nữ" : "Female"}</option>
                <option value="Khác">{language === "vi" ? "Khác" : "Other"}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {language === "vi" ? "Địa chỉ" : "Address"}
            </label>
            <input
              type="text"
              value={profileEditData.address}
              onChange={(e) =>
                setProfileEditData({ ...profileEditData, address: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-medium"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <Award size={16} className="text-amber-500" />
              {language === "vi"
                ? "Chế độ Thưởng & Hoa hồng"
                : "Commission & Completion Bonus"}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-1">
              <div>
                <div className="text-xs text-slate-500">
                  {language === "vi" ? "Tỷ lệ Hoa hồng (%):" : "Commission Rate (%):"}
                </div>
                <div className="text-lg font-extrabold text-blue-600 mt-0.5">
                  {user?.commission_percent !== undefined
                    ? `${user.commission_percent}%`
                    : "10%"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {language === "vi"
                    ? "Thưởng Hoàn thành (%):"
                    : "Completion Bonus (%):"}
                </div>
                <div className="text-lg font-extrabold text-indigo-600 mt-0.5">
                  {user?.bonus_completion_percent !== undefined
                    ? `${user.bonus_completion_percent}%`
                    : "5%"}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
              {language === "vi"
                ? "* Tỷ lệ này do Ban Giám đốc thiết lập và áp dụng tự động cho các hồ sơ giải quyết thành công."
                : "* Set by the Board of Directors. Automatically calculated upon litigation case completion."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 active:scale-95"
            >
              {language === "vi" ? "Hủy" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-[var(--color-primary)]/10"
            >
              {language === "vi" ? "Lưu thay đổi" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
