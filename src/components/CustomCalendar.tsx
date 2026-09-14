import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  getDay,
  getYear,
  getMonth,
  getDate,
  setHours,
  setMinutes,
} from "date-fns";
import { vi, enUS } from "date-fns/locale";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar as CalendarIcon,
  Inbox,
  X,
  Trash2,
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  AlertCircle,
  Bell,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Solar, Lunar } from "lunar-javascript";
import DatePickerInput from "./DatePickerInput";

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  allDay?: boolean;
  type?: string;        // 'meeting' | 'court' | 'client' | 'research' | 'other'
  description?: string;
  location?: string;
  priority?: 'high' | 'medium' | 'low';
  participants?: string[];
  reminder?: string;
}

interface CustomCalendarProps {
  language: "vi" | "en";
  user?: any;
  myPermissions?: any;
  users?: any[];
  events?: any[];
  setEvents?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CustomCalendar({
  language,
  user,
  myPermissions,
  users = [],
  events: parentEvents,
  setEvents: parentSetEvents,
}: CustomCalendarProps) {
  const staffList = useMemo(() => {
    if (users && users.length > 0) {
      return users.map((u: any) => {
        let roleLabel = "Nhân sự";
        if (u.role) {
          const rLower = u.role.toLowerCase();
          if (rLower === "admin" || rLower === "quản trị viên") roleLabel = "QTV";
          else if (rLower === "director" || rLower === "giám đốc") roleLabel = "Giám đốc";
          else if (rLower === "lawyer" || rLower === "luật sư") roleLabel = "Luật sư";
          else if (rLower === "assistant" || rLower === "trợ lý") roleLabel = "Trợ lý";
          else roleLabel = u.role;
        }
        
        let colorGrad = "from-emerald-500 to-teal-600";
        if (u.role) {
          const rLower = u.role.toLowerCase();
          if (rLower === "admin" || rLower === "quản trị viên") colorGrad = "from-blue-500 to-indigo-600";
          else if (rLower === "director" || rLower === "giám đốc") colorGrad = "from-amber-500 to-orange-600";
          else if (rLower === "lawyer" || rLower === "luật sư") colorGrad = "from-emerald-500 to-teal-600";
          else if (rLower === "assistant" || rLower === "trợ lý") colorGrad = "from-purple-500 to-violet-600";
        }

        return {
          name: u.name || u.username,
          username: u.username,
          role: roleLabel,
          sub: u.role ? `Vai trò: ${u.role}` : "Thành viên văn phòng",
          color: colorGrad,
        };
      });
    }

    // Default static fallback list if users prop is not provided or empty
    return [
      { name: "Quản trị viên", username: "admin", role: "QTV", sub: "Quản lý hệ thống", color: "from-blue-500 to-indigo-600" },
      { name: "Trần Quốc Toản", username: "toantran", role: "Luật sư", sub: "Trưởng phòng tranh tụng", color: "from-emerald-500 to-teal-600" },
      { name: "Nguyễn Minh Châu", username: "chaunguyen", role: "Luật sư", sub: "Chuyên gia tư vấn doanh nghiệp", color: "from-pink-500 to-rose-600" },
      { name: "Lê Thị Hồng", username: "hongle", role: "Trợ lý", sub: "Phó phòng nghiệp vụ", color: "from-purple-500 to-violet-600" },
    ];
  }, [users]);

  const canManageEvents = myPermissions
    ? myPermissions.manageEvents
    : ["admin", "director", "deputyDirector", "deputy_director", "manager", "head_of_department", "manage"].includes(
        user?.role || "",
      );
  const canViewEventHistory = myPermissions
    ? myPermissions.viewEventHistory
    : ["admin", "director", "deputyDirector", "deputy_director"].includes(user?.role || "");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"year" | "month" | "day">("year");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);

  const [localEvents, setLocalEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("erp_calendar_events");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return [
      {
        id: 1,
        title: "Phiên tòa sơ thẩm - Tranh chấp Đất đai Quận 2",
        startDate: todayStr,
        startTime: "09:00",
        endDate: todayStr,
        endTime: "11:30",
        color: "red",
        type: "Tòa án",
        notes: "Bào chữa cho bị đơn trong vụ án tranh chấp ranh giới quyền sử dụng đất tại Tòa án nhân dân Quận 2.",
        location: "Phòng xử án số 3 - TAND Quận 2",
        priority: "Cao",
        participants: ["Quản trị viên", "Trần Quốc Toản"],
        reminder: "15 phút trước"
      },
      {
        id: 2,
        title: "Tư vấn rà soát hợp đồng đầu tư - Tập đoàn Vingroup",
        startDate: todayStr,
        startTime: "14:00",
        endDate: todayStr,
        endTime: "15:30",
        color: "blue",
        type: "Gặp khách hàng",
        notes: "Làm việc với đại diện pháp lý Vingroup để rà soát các điều khoản bảo đảm và phạt vi phạm trong hợp đồng hợp tác đầu tư xây dựng.",
        location: "Phòng họp Lotus - Trụ sở chính",
        priority: "Trung bình",
        participants: ["Quản trị viên", "Lê Thị Hồng"],
        reminder: "1 giờ trước"
      },
      {
        id: 3,
        title: "Nghiên cứu hồ sơ vụ án Hình sự - Bị cáo Nguyễn Văn A",
        startDate: todayStr,
        startTime: "16:00",
        endDate: todayStr,
        endTime: "17:30",
        color: "emerald",
        type: "Công tác",
        notes: "Nghiên cứu hồ sơ bệnh án pháp y và biên bản khám nghiệm hiện trường vụ án cố ý gây thương tích.",
        location: "Thư viện văn phòng",
        priority: "Cao",
        participants: ["Nguyễn Minh Châu"],
        reminder: "1 ngày trước"
      }
    ];
  });

  const mapParentToCalendar = (e: any): Event => {
    let startObj: Date;
    let endObj: Date;

    if (e.start instanceof Date) {
      startObj = e.start;
    } else if (e.startDate && e.startTime) {
      startObj = new Date(`${e.startDate}T${e.startTime}`);
    } else if (e.date && e.start) {
      startObj = new Date(`${e.date}T${e.start}`);
    } else {
      startObj = new Date();
    }

    if (e.end instanceof Date) {
      endObj = e.end;
    } else if (e.endDate && e.endTime) {
      endObj = new Date(`${e.endDate}T${e.endTime}`);
    } else if (e.date && e.end) {
      endObj = new Date(`${e.date}T${e.end}`);
    } else {
      endObj = new Date(startObj.getTime() + 60 * 60 * 1000);
    }

    if (isNaN(startObj.getTime())) startObj = new Date();
    if (isNaN(endObj.getTime())) endObj = new Date(startObj.getTime() + 60 * 60 * 1000);

    let calType = "other";
    if (e.type === "Tòa án" || e.type === "court" || e.type === "Phiên tòa") calType = "court";
    else if (e.type === "Họp" || e.type === "meeting" || e.type === "Họp nội bộ") calType = "meeting";
    else if (e.type === "Gặp khách hàng" || e.type === "client" || e.type === "Khách hàng") calType = "client";
    else if (e.type === "Công tác" || e.type === "research" || e.type === "Nghiên cứu") calType = "research";

    let calPriority: 'high' | 'medium' | 'low' = "medium";
    if (e.priority === "Cao" || e.priority === "high") calPriority = "high";
    else if (e.priority === "Thấp" || e.priority === "low") calPriority = "low";

    let calReminder = "none";
    if (e.reminder === "15 phút trước" || e.reminder === "15min") calReminder = "15min";
    else if (e.reminder === "1 giờ trước" || e.reminder === "1hour") calReminder = "1hour";
    else if (e.reminder === "1 ngày trước" || e.reminder === "1day") calReminder = "1day";

    let color = e.color || "blue";
    if (calType === "court") color = "red";
    else if (calType === "meeting") color = "purple";
    else if (calType === "client") color = "blue";
    else if (calType === "research") color = "green";

    return {
      id: e.id,
      title: e.title,
      start: startObj,
      end: endObj,
      allDay: e.allDay || false,
      type: calType,
      description: e.notes || e.description || "",
      location: e.location || "",
      priority: calPriority,
      participants: e.participants || [],
      reminder: calReminder,
      color,
    };
  };

  const mapCalendarToParent = (formData: any) => {
    let parentType = "Họp";
    let color = "orange";
    let icon = "Briefcase";

    if (formData.type === "court") {
      parentType = "Tòa án";
      color = "red";
      icon = "Gavel";
    } else if (formData.type === "meeting") {
      parentType = "Họp";
      color = "orange";
      icon = "Briefcase";
    } else if (formData.type === "client") {
      parentType = "Gặp khách hàng";
      color = "blue";
      icon = "Users";
    } else if (formData.type === "research") {
      parentType = "Công tác";
      color = "emerald";
      icon = "MapPin";
    }

    let parentPriority = "Trung bình";
    if (formData.priority === "high") parentPriority = "Cao";
    else if (formData.priority === "low") parentPriority = "Thấp";

    let parentReminder = "Không nhắc nhở";
    if (formData.reminder === "15min") parentReminder = "15 phút trước";
    else if (formData.reminder === "1hour") parentReminder = "1 giờ trước";
    else if (formData.reminder === "1day") parentReminder = "1 ngày trước";

    return {
      title: formData.title,
      date: formData.startDate,
      startDate: formData.startDate,
      start: formData.startTime || "00:00",
      startTime: formData.startTime || "00:00",
      end: formData.endTime || "23:59",
      endTime: formData.endTime || "23:59",
      type: parentType,
      location: formData.location || "",
      priority: parentPriority,
      allDay: formData.allDay || false,
      reminder: parentReminder,
      notes: formData.description || "",
      color,
      icon,
    };
  };

  const activeEventsList = parentEvents || localEvents;

  const events = useMemo(() => {
    return activeEventsList.map(mapParentToCalendar);
  }, [activeEventsList]);

  useEffect(() => {
    if (!parentEvents) {
      try {
        localStorage.setItem("erp_calendar_events", JSON.stringify(localEvents));
      } catch (e) {
        console.warn("Could not save calendar events to localStorage:", e);
      }
    }
  }, [localEvents, parentEvents]);

  const locale = language === "vi" ? vi : enUS;

  // Helper to get lunar info
  const getLunarInfo = (date: Date) => {
    const solar = Solar.fromYmd(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
    const lunar = solar.getLunar();

    const stems = [
      "Canh",
      "Tân",
      "Nhâm",
      "Quý",
      "Giáp",
      "Ất",
      "Bính",
      "Đinh",
      "Mậu",
      "Kỷ",
    ];
    const branches = [
      "Thân",
      "Dậu",
      "Tuất",
      "Hợi",
      "Tý",
      "Sửu",
      "Dần",
      "Mão",
      "Thìn",
      "Tỵ",
      "Ngọ",
      "Mùi",
    ];
    const lunarYear = lunar.getYear();
    const yearName = `${stems[lunarYear % 10]} ${branches[lunarYear % 12]}`;

    return {
      day: lunar.getDay(),
      month: lunar.getMonth(),
      year: lunarYear,
      yearInGanZhi: yearName,
    };
  };

  const getHolidayInfo = (date: Date, lunarDay: number, lunarMonth: number) => {
    const d = date.getDate();
    const m = date.getMonth() + 1;

    // Solar holidays
    if (d === 1 && m === 1) return "Tết Dương lịch";
    if (d === 30 && m === 4) return "Giải phóng miền Nam";
    if (d === 1 && m === 5) return "Quốc tế Lao động";
    if (d === 2 && m === 9) return "Quốc khánh";

    // Lunar holidays
    if (lunarDay === 10 && lunarMonth === 3) return "Giỗ tổ Hùng Vương";
    if (lunarDay === 1 && lunarMonth === 1) return "Mùng 1 Tết";
    if (lunarDay === 2 && lunarMonth === 1) return "Mùng 2 Tết";
    if (lunarDay === 3 && lunarMonth === 1) return "Mùng 3 Tết";
    if (lunarDay === 4 && lunarMonth === 1) return "Mùng 4 Tết";
    if (lunarDay === 5 && lunarMonth === 1) return "Mùng 5 Tết";
    if (lunarDay === 15 && lunarMonth === 8) return "Tết Trung Thu";

    return null;
  };

  const [showModal, setShowModal] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [titleError, setTitleError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    start: new Date(),
    end: new Date(),
  });

  const [history, setHistory] = useState<
    { action: string; title: string; user: string; time: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem("erp_event_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("erp_event_history", JSON.stringify(history));
    } catch (e) {
      console.warn("Could not save history to localStorage:", e);
    }
  }, [history]);
  const [showHistory, setShowHistory] = useState(false);

  const handleAddEvent = () => {
    setModalMode("add");
    setTitleError(false);
    setDateError(false);
    const now = new Date();
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    setFormData({
      title: "",
      startDate: format(now, "yyyy-MM-dd"),
      startTime: format(now, "HH:mm"),
      endDate: format(now, "yyyy-MM-dd"),
      endTime: format(oneHourLater, "HH:mm"),
      allDay: false,
      type: "meeting",
      description: "",
      location: "",
      priority: "medium",
      participants: [],
      reminder: "none",
    });
    setShowModal(true);
  };

  const handleSaveEvent = () => {
    if (!formData.title.trim()) {
      setTitleError(true);
      return;
    }
    if (!formData.startDate) {
      setDateError(true);
      return;
    }

    const startStr = `${formData.startDate}T${formData.startTime || "00:00"}`;
    const endStr = `${formData.endDate || formData.startDate}T${formData.endTime || "23:59"}`;

    let finalColor = "blue";
    if (formData.type === "court") finalColor = "red";
    else if (formData.type === "meeting") finalColor = "purple";
    else if (formData.type === "client") finalColor = "blue";
    else if (formData.type === "research") finalColor = "green";

    const eventData = {
      title: formData.title,
      start: new Date(startStr),
      end: new Date(endStr),
      allDay: formData.allDay,
      type: formData.type,
      description: formData.description,
      location: formData.location,
      priority: formData.priority,
      participants: formData.participants,
      reminder: formData.reminder,
      color: finalColor,
    };

    const parentEventData = mapCalendarToParent(formData);

    if (modalMode === "add") {
      const newId = Date.now();
      if (parentSetEvents) {
        parentSetEvents([...(parentEvents || []), { id: newId, ...parentEventData }]);
      } else {
        setLocalEvents([...localEvents, { id: newId, ...parentEventData }]);
      }
      setHistory((h) => [
        {
          action: "Thêm",
          title: eventData.title,
          user: user?.name || user?.username || "Chưa rõ",
          time: new Date().toLocaleString("vi-VN"),
        },
        ...h,
      ]);
    } else if (selectedEvent) {
      if (parentSetEvents) {
        parentSetEvents(
          (parentEvents || []).map((e) =>
            e.id === selectedEvent.id ? { ...e, ...parentEventData } : e
          )
        );
      } else {
        setLocalEvents(
          localEvents.map((e) =>
            e.id === selectedEvent.id ? { ...e, ...parentEventData } : e
          )
        );
      }
      setHistory((h) => [
        {
          action: "Sửa",
          title: eventData.title,
          user: user?.name || user?.username || "Chưa rõ",
          time: new Date().toLocaleString("vi-VN"),
        },
        ...h,
      ]);
    }
    setShowModal(false);
  };

  const handleEditEvent = (event: Event) => {
    setModalMode("edit");
    setTitleError(false);
    setDateError(false);
    setSelectedEvent(event);
    const startObj = new Date(event.start);
    const endObj = new Date(event.end);
    setFormData({
      title: event.title,
      startDate: format(startObj, "yyyy-MM-dd"),
      startTime: format(startObj, "HH:mm"),
      endDate: format(endObj, "yyyy-MM-dd"),
      endTime: format(endObj, "HH:mm"),
      allDay: event.allDay || false,
      type: event.type || "other",
      description: event.description || "",
      location: event.location || "",
      priority: event.priority || "medium",
      participants: event.participants || [],
      reminder: event.reminder || "none",
    });
    setShowModal(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      if (parentSetEvents) {
        parentSetEvents((parentEvents || []).filter((e) => e.id !== selectedEvent.id));
      } else {
        setLocalEvents(localEvents.filter((e) => e.id !== selectedEvent.id));
      }
      setHistory((h) => [
        {
          action: "Xóa",
          title: selectedEvent.title,
          user: user?.name || user?.username || "Chưa rõ",
          time: new Date().toLocaleString("vi-VN"),
        },
        ...h,
      ]);
      setShowModal(false);
    }
  };

  const yearContainerRef = useRef<HTMLDivElement>(null);
  const monthContainerRef = useRef<HTMLDivElement>(null);

  const scrollToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);

    setTimeout(() => {
      if (view === "year") {
        const currentMonthEl = yearContainerRef.current?.querySelector(
          `[data-month="${now.getMonth()}"]`,
        );
        if (currentMonthEl)
          currentMonthEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      } else if (view === "month") {
        const currentMonthEl2 = monthContainerRef.current?.querySelector(
          `[data-month="${now.getMonth()}"]`,
        );
        if (currentMonthEl2)
          currentMonthEl2.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      } else if (view === "day") {
        const todayDayEl = document.querySelector('[data-is-today="true"]');
        if (todayDayEl)
          todayDayEl.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
      }
    }, 50);
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = eachMonthOfInterval({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate),
    });

    const lunarYearName = getLunarInfo(new Date(year, 0, 1)).yearInGanZhi;

    return (
      <div
        className="bg-white p-6 rounded-lg shadow-sm h-full overflow-y-auto"
        ref={yearContainerRef}
      >
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(year - 1, 0, 1))}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-3xl font-extrabold text-[var(--color-primary)] font-serif tracking-tight border-b-2 border-[var(--color-accent)] px-1">{year}</h1>
            <button
              onClick={() => setCurrentDate(new Date(year + 1, 0, 1))}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-slate-500">
              <div className="flex items-center justify-end gap-2">
                <div className="w-4 h-[1px] bg-red-400"></div>
                <span>
                  {lunarYearName} {year}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <div className="w-4 h-[1px] bg-slate-300"></div>
                <span>Ngày đầu tiên của tháng âm lịch</span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium transition-all duration-300 hover:bg-slate-200 active:scale-95 whitespace-nowrap"
                title="Lịch sử sự kiện"
              >
                <CalendarIcon size={18} /> Lịch sử
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors">
                <Search size={20} />
              </button>
              <button
                onClick={handleAddEvent}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] shadow-md hover:shadow-lg hover:shadow-[var(--color-primary)]/20 text-white rounded-xl font-bold transition-all duration-300 active:scale-95 whitespace-nowrap hover:scale-[1.02] border border-white/10"
              >
                <Plus size={18} /> Thêm sự kiện
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 pb-24">
          {months.map((month, idx) => {
            const days = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month),
            });

            const startDay = getDay(startOfMonth(month));
            // Adjust for Monday start (0 = Sunday, 1 = Monday)
            const emptyDays = startDay === 0 ? 6 : startDay - 1;

            return (
              <div
                key={idx}
                className="flex flex-col"
                data-month={month.getMonth()}
              >
                <h3
                  className="text-xl font-bold text-slate-900 mb-4 cursor-pointer hover:text-red-500 transition-colors"
                  onClick={() => {
                    setCurrentDate(month);
                    setSelectedDate(startOfMonth(month));
                    setView("month");
                  }}
                >
                  Tháng {idx + 1}
                </h3>
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-sm">
                  {/* Empty cells for padding */}
                  {Array.from({ length: emptyDays }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8"></div>
                  ))}

                  {/* Days */}
                  {days.map((day, dayIdx) => {
                    const isToday = isSameDay(day, new Date());
                    const lunar = getLunarInfo(day);
                    const isFirstLunarDay = lunar.day === 1;
                    const hasEvents = events.some((e) =>
                      isSameDay(e.start, day),
                    );

                    return (
                      <div
                        key={dayIdx}
                        className="relative h-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 rounded-lg"
                        onClick={() => {
                          setSelectedDate(day);
                          setCurrentDate(day);
                          setView("day");
                        }}
                      >
                        <span
                          className={`
                          w-7 h-7 flex items-center justify-center rounded-lg
                          ${isToday ? "bg-red-500 text-white font-bold" : "text-slate-800"}
                        `}
                        >
                          {getDate(day)}
                        </span>
                        {isFirstLunarDay && !isToday && (
                          <div className="absolute bottom-0 w-3 h-[2px] bg-red-400"></div>
                        )}
                        {hasEvents && !isToday && (
                          <div className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-400"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
          <button
            onClick={scrollToToday}
            className="px-6 py-3 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] font-medium text-slate-800 hover:bg-slate-50 transition-colors pointer-events-auto"
          >
            Hôm nay
          </button>
          <div className="flex bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-1 pointer-events-auto">
            <button className="w-12 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <CalendarIcon size={20} />
            </button>
            <button className="w-12 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800">
              <Inbox size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const monthRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (view === "month") {
      const monthIndex = currentDate.getMonth();
      if (monthRefs.current[monthIndex]) {
        monthRefs.current[monthIndex]?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [view, currentDate]);

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const months = eachMonthOfInterval({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate),
    });

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <button
            onClick={() => setView("year")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            {year}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium transition-all duration-300 hover:bg-slate-200 active:scale-95 whitespace-nowrap"
              title="Lịch sử sự kiện"
            >
              <CalendarIcon size={18} /> Lịch sử
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors">
              <Search size={20} />
            </button>
            <button
              onClick={handleAddEvent}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] shadow-md hover:shadow-lg hover:shadow-[var(--color-primary)]/20 text-white rounded-xl font-bold transition-all duration-300 active:scale-95 whitespace-nowrap hover:scale-[1.02] border border-white/10"
            >
              <Plus size={18} /> Thêm sự kiện
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-4 shrink-0 border-b border-slate-100 pb-2">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Scrollable months */}
        <div className="flex-1 overflow-y-auto pb-24">
          {months.map((month, idx) => {
            const days = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month),
            });

            const startDay = getDay(startOfMonth(month));
            const emptyDays = startDay === 0 ? 6 : startDay - 1;

            return (
              <div
                key={idx}
                className="mb-8"
                data-month={month.getMonth()}
                ref={(el) => {
                  if (el) monthRefs.current[idx] = el;
                }}
              >
                <h3
                  className={`text-3xl font-bold mb-6 text-center ${idx === new Date().getMonth() && year === new Date().getFullYear() ? "text-red-500" : "text-slate-900"}`}
                >
                  Tháng {idx + 1}
                </h3>
                <div className="grid grid-cols-7 gap-y-6 text-center">
                  {Array.from({ length: emptyDays }).map((_, i) => (
                    <div key={`empty-${i}`}></div>
                  ))}

                  {days.map((day, dayIdx) => {
                    const isToday = isSameDay(day, new Date());
                    const lunar = getLunarInfo(day);
                    const holiday = getHolidayInfo(day, lunar.day, lunar.month);
                    const dayEvents = events.filter((e) =>
                      isSameDay(e.start, day),
                    );
                    const hasEvents = dayEvents.length > 0;
                    const getDotColor = (evt: Event) => {
                      switch (evt.type) {
                        case "court": return "bg-red-500";
                        case "meeting": return "bg-purple-500";
                        case "client": return "bg-sky-500";
                        case "research": return "bg-emerald-500";
                        default: return evt.color === "red" ? "bg-red-500" : "bg-blue-500";
                      }
                    };
                    const eventColor = hasEvents ? getDotColor(dayEvents[0]) : "";

                    return (
                      <div
                        key={dayIdx}
                        className="flex flex-col items-center cursor-pointer group relative h-16"
                        onClick={() => {
                          setSelectedDate(day);
                          setCurrentDate(day);
                          setView("day");
                        }}
                      >
                        <div
                          className={`
                          flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors
                          ${isToday ? "bg-red-500 text-white" : "group-hover:bg-slate-100"}
                        `}
                        >
                          <span
                            className={`text-xl font-medium leading-none ${isToday ? "text-white" : "text-slate-900"}`}
                          >
                            {getDate(day)}
                          </span>
                          <span
                            className={`text-[10px] mt-1 ${isToday ? "text-white/90" : holiday ? "text-red-500 font-medium" : "text-slate-500"}`}
                          >
                            {holiday
                              ? holiday
                              : lunar.day === 1
                                ? `Thg ${lunar.month}`
                                : lunar.day}
                          </span>
                        </div>
                        {hasEvents && (
                          <div
                            className={`absolute bottom-0 w-1.5 h-1.5 rounded-lg ${eventColor}`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="h-px bg-slate-100 mt-8"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
          <button
            onClick={scrollToToday}
            className="px-6 py-3 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] font-medium text-slate-800 hover:bg-slate-50 transition-colors pointer-events-auto"
          >
            Hôm nay
          </button>
          <div className="flex bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-1 pointer-events-auto">
            <button className="w-12 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <CalendarIcon size={20} />
            </button>
            <button className="w-12 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800">
              <Inbox size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (view === "day" && timelineRef.current) {
      if (isSameDay(selectedDate, new Date())) {
        const currentHour = new Date().getHours();
        timelineRef.current.scrollTop = Math.max(0, (currentHour - 2) * 60);
      } else {
        timelineRef.current.scrollTop = 8 * 60; // Scroll to 8 AM
      }
    }
  }, [view, selectedDate]);

  const renderDayView = () => {
    const startOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const endOfSelectedWeek = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: startOfSelectedWeek,
      end: endOfSelectedWeek,
    });

    const lunarInfo = getLunarInfo(selectedDate);
    const lunarString = `${lunarInfo.day}/${lunarInfo.month} năm ${lunarInfo.yearInGanZhi}`;

    const hours = Array.from({ length: 24 }, (_, i) => i); // 05:00 to 21:00

    const dayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

    return (
      <div className="bg-white rounded-lg shadow-sm h-full flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-100">
          <button
            onClick={() => setView("year")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-800"
          >
            <ChevronLeft size={18} />
            Tháng {getMonth(selectedDate) + 1}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium transition-all duration-300 hover:bg-slate-200 active:scale-95 whitespace-nowrap"
              title="Lịch sử sự kiện"
            >
              <CalendarIcon size={18} /> Lịch sử
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors">
              <Search size={20} />
            </button>
            <button
              onClick={handleAddEvent}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] shadow-md hover:shadow-lg hover:shadow-[var(--color-primary)]/20 text-white rounded-xl font-bold transition-all duration-300 active:scale-95 whitespace-nowrap hover:scale-[1.02] border border-white/10"
            >
              <Plus size={18} /> Thêm sự kiện
            </button>
          </div>
        </div>

        {/* Week Scroller */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex justify-between">
            {weekDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const lunar = getLunarInfo(day);
              const hasEvents = events.some((e) => isSameDay(e.start, day));
              const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setSelectedDate(day)}
                  data-is-today={isToday}
                  data-date={day.toISOString()}
                >
                  <span className="text-xs font-medium text-slate-500 mb-2">
                    {dayNames[getDay(day)]}
                  </span>
                  <div
                    className={`
                    w-12 h-12 flex flex-col items-center justify-center rounded-lg relative
                    ${isSelected ? (isToday ? "bg-red-500 text-white" : "bg-slate-900 text-white") : ""}
                    ${!isSelected && isToday ? "text-red-500" : ""}
                    ${!isSelected && !isToday ? "text-slate-800 hover:bg-slate-50" : ""}
                  `}
                  >
                    <span className="text-lg font-semibold leading-none">
                      {getDate(day)}
                    </span>
                    <span
                      className={`text-[10px] mt-1 ${isSelected ? "text-white/80" : "text-slate-400"}`}
                    >
                      {lunar.day}
                    </span>
                    {hasEvents && !isSelected && (
                      <div
                        className={`absolute -bottom-1.5 w-1 h-1 rounded-lg ${isToday ? "bg-red-500" : "bg-blue-400"}`}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Header */}
        <div className="py-4 text-center border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][getDay(selectedDate)]} -{" "}
            {getDate(selectedDate)} thg {getMonth(selectedDate) + 1},{" "}
            {getYear(selectedDate)}
          </h2>
          <p className="text-sm text-slate-500">
            {lunarInfo.day}/{lunarInfo.month} năm {lunarInfo.yearInGanZhi}
          </p>
        </div>

        {/* All Day Events */}
        {dayEvents.filter((e) => e.allDay).length > 0 && (
          <div className="flex px-4 py-3 border-b border-slate-100 gap-2 overflow-x-auto">
            <div className="w-14 shrink-0 text-xs text-slate-400 text-center flex flex-col justify-center">
              cả
              <br />
              ngày
            </div>
            <div className="flex gap-2">
              {dayEvents
                .filter((e) => e.allDay)
                .map((event, idx) => {
                  const getBadgeClasses = (evt: Event) => {
                    switch (evt.type) {
                      case "court":
                        return "bg-red-50 text-red-700 border-red-100 hover:bg-red-100";
                      case "meeting":
                        return "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100";
                      case "client":
                        return "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100";
                      case "research":
                        return "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100";
                      default:
                        return "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100";
                    }
                  };
                  return (
                    <div
                      key={idx}
                      onClick={() => handleEditEvent(event)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 whitespace-nowrap border cursor-pointer transition-colors ${getBadgeClasses(event)}`}
                    >
                      <CalendarIcon size={14} />
                      {event.title}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          className="flex-1 overflow-y-auto relative pb-24"
          ref={timelineRef}
        >
          <div className="absolute top-0 bottom-0 left-14 w-px bg-slate-100"></div>

          {/* Current Time Indicator */}
          {isSameDay(selectedDate, new Date()) && (
            <div
              className="absolute left-14 right-0 z-20 flex items-center"
              style={{
                top: `${new Date().getHours() * 60 + new Date().getMinutes()}px`,
                transform: "translateY(-50%)",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
              <div className="h-px bg-red-500 flex-1"></div>
            </div>
          )}

          {hours.map((hour) => (
            <div key={hour} className="flex relative h-[60px] group">
              <div className="w-14 shrink-0 text-xs text-slate-400 text-center py-2 pr-2">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="flex-1 border-t border-slate-100 relative">
                {/* Render events for this hour */}
                {dayEvents
                  .filter((e) => !e.allDay && e.start.getHours() === hour)
                  .map((event, idx) => {
                    const startMinutes = event.start.getMinutes();
                    const durationMinutes =
                      (event.end.getTime() - event.start.getTime()) /
                      (1000 * 60);
                    const top = startMinutes;
                    const height = durationMinutes;

                    const getEventStyle = (evt: Event) => {
                      switch (evt.type) {
                        case "court":
                          return {
                            bg: "#fee2e2",
                            border: "#ef4444",
                            text: "text-red-800",
                            timeText: "text-red-600",
                            badgeBg: "bg-red-100 text-red-800",
                            badgeText: "Phiên tòa"
                          };
                        case "meeting":
                          return {
                            bg: "#f3e8ff",
                            border: "#a855f7",
                            text: "text-purple-800",
                            timeText: "text-purple-600",
                            badgeBg: "bg-purple-100 text-purple-800",
                            badgeText: "Họp nội bộ"
                          };
                        case "client":
                          return {
                            bg: "#e0f2fe",
                            border: "#0ea5e9",
                            text: "text-sky-800",
                            timeText: "text-sky-600",
                            badgeBg: "bg-sky-100 text-sky-800",
                            badgeText: "Khách hàng"
                          };
                        case "research":
                          return {
                            bg: "#d1fae5",
                            border: "#10b981",
                            text: "text-emerald-800",
                            timeText: "text-emerald-600",
                            badgeBg: "bg-emerald-100 text-emerald-800",
                            badgeText: "Nghiên cứu"
                          };
                        default:
                          return {
                            bg: "#f1f5f9",
                            border: "#64748b",
                            text: "text-slate-800",
                            timeText: "text-slate-600",
                            badgeBg: "bg-slate-200 text-slate-800",
                            badgeText: "Sự kiện"
                          };
                      }
                    };

                    const style = getEventStyle(event);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleEditEvent(event)}
                        className="absolute left-2 right-4 rounded-lg border-l-4 p-2 overflow-hidden cursor-pointer hover:opacity-95 transition-all shadow-sm flex flex-col justify-between"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: style.bg,
                          borderColor: style.border,
                          zIndex: 10,
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1 rounded uppercase tracking-wider ${style.badgeBg}`}>
                              {style.badgeText}
                            </span>
                            {event.priority === "high" && (
                              <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded uppercase">
                                Gấp
                              </span>
                            )}
                            <span className={`text-xs font-bold ${style.text} truncate block max-w-full`}>
                              {event.title}
                            </span>
                          </div>
                          {height > 40 && event.location && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                        {height > 35 && (
                          <div className={`text-[10px] font-semibold ${style.timeText}`}>
                            {format(new Date(event.start), "HH:mm")} - {format(new Date(event.end), "HH:mm")}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
          <button
            onClick={scrollToToday}
            className="px-6 py-3 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] font-medium text-slate-800 hover:bg-slate-50 transition-colors pointer-events-auto"
          >
            Hôm nay
          </button>
          <div className="flex bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-1 pointer-events-auto">
            <button className="w-12 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <CalendarIcon size={20} />
            </button>
            <button className="w-12 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800">
              <Inbox size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[800px] relative">
      {view === "year" && renderYearView()}
      {view === "month" && renderMonthView()}
      {view === "day" && renderDayView()}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0a2d37] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <CalendarIcon size={18} className="text-amber-500 font-bold" />
                </div>
                <h3 className="text-base font-bold tracking-wide">
                  {modalMode === "add" ? "Thêm Sự Kiện Lịch Làm Việc" : "Chi Tiết & Cập Nhật Sự Kiện"}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FileText size={15} className="text-slate-400" /> TÊN SỰ KIỆN / TIÊU ĐỀ CÔNG VIỆC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (e.target.value.trim()) setTitleError(false);
                  }}
                  placeholder="Ví dụ: Phiên tòa phúc thẩm tranh chấp hợp đồng..."
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#0a2d37] focus:border-transparent outline-none transition-all text-sm font-semibold placeholder-slate-400 shadow-sm ${
                    titleError ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                  }`}
                  autoFocus
                />
                {titleError && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                    ⚠️ Vui lòng nhập tên sự kiện hoặc tiêu đề công việc.
                  </p>
                )}
              </div>

              {/* Event Type & Priority Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Event Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <Briefcase size={15} className="text-slate-400" /> PHÂN LOẠI CÔNG VIỆC
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "court", label: "Phiên tòa", activeClass: "bg-red-50 border-red-300 text-red-700 font-bold shadow-sm ring-2 ring-red-100", inactiveClass: "bg-red-50/20 border-red-100/50 text-red-600/70 hover:bg-red-50 hover:text-red-700" },
                      { key: "meeting", label: "Họp nội bộ", activeClass: "bg-purple-50 border-purple-300 text-purple-700 font-bold shadow-sm ring-2 ring-purple-100", inactiveClass: "bg-purple-50/20 border-purple-100/50 text-purple-600/70 hover:bg-purple-50 hover:text-purple-700" },
                      { key: "client", label: "Khách hàng", activeClass: "bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm ring-2 ring-blue-100", inactiveClass: "bg-blue-50/20 border-blue-100/50 text-blue-600/70 hover:bg-blue-50 hover:text-blue-700" },
                      { key: "research", label: "Nghiên cứu", activeClass: "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold shadow-sm ring-2 ring-emerald-100", inactiveClass: "bg-emerald-50/20 border-emerald-100/50 text-emerald-600/70 hover:bg-emerald-50 hover:text-emerald-700" },
                    ].map((item) => {
                      const isActive = formData.type === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: item.key })}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border text-center active:scale-95 ${isActive ? item.activeClass : item.inactiveClass}`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-slate-400" /> MỨC ĐỘ KHẨN CẤP / ƯU TIÊN
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: "low", label: "Thấp", activeClass: "bg-slate-100 border-slate-300 text-slate-800 font-bold ring-2 ring-slate-100", inactiveClass: "bg-slate-50/50 border-slate-200/60 text-slate-500 hover:bg-slate-50" },
                      { key: "medium", label: "Trung bình", activeClass: "bg-amber-500 border-amber-600 text-white font-bold ring-2 ring-amber-100", inactiveClass: "bg-amber-50/50 border-amber-200/60 text-amber-600 hover:bg-amber-50" },
                      { key: "high", label: "Cao", activeClass: "bg-red-500 border-red-600 text-white font-bold ring-2 ring-red-100", inactiveClass: "bg-red-50/50 border-red-200/60 text-red-600 hover:bg-red-50" },
                    ].map((item) => {
                      const isActive = formData.priority === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: item.key })}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border text-center active:scale-95 ${isActive ? item.activeClass : item.inactiveClass}`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Datetime Selection */}
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" /> BẮT ĐẦU TỪ NGÀY / GIỜ
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <DatePickerInput
                          value={formData.startDate}
                          onChange={(val: string) => {
                            setFormData({
                              ...formData,
                              startDate: val,
                            });
                            setDateError(false);
                          }}
                          className={`w-full px-4 py-2 border rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-[#0a2d37] outline-none transition-all ${
                            dateError ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                          }`}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div className="relative w-28 shrink-0">
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-[38px] px-3 border border-slate-200 rounded-xl bg-white flex justify-between items-center text-slate-700 text-sm font-medium">
                          <span>{formData.startTime || "--:--"}</span>
                          <Clock size={14} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                    {dateError && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1">
                        ⚠️ Vui lòng chọn ngày bắt đầu.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" /> HOÀN THÀNH / KẾT THÚC LÚC
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <DatePickerInput
                          value={formData.endDate}
                          onChange={(val: string) =>
                            setFormData({
                              ...formData,
                              endDate: val,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-[#0a2d37] outline-none transition-all"
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div className="relative w-28 shrink-0">
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-[38px] px-3 border border-slate-200 rounded-xl bg-white flex justify-between items-center text-slate-700 text-sm font-medium">
                          <span>{formData.endTime || "--:--"}</span>
                          <Clock size={14} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Công việc kéo dài cả ngày</p>
                    <p className="text-[11px] text-slate-400 font-medium">Không hiển thị khung giờ cụ thể trên dòng thời gian</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.allDay || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allDay: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0a2d37]"></div>
                  </label>
                </div>
              </div>

              {/* Location & Reminder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" /> ĐỊA ĐIỂM DIỄN RA / ĐƯỜNG DẪN HỌP
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Tòa án nhân dân, Phòng họp, Link Zoom..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none text-sm font-semibold placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Reminder Option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Bell size={14} className="text-slate-400" /> THIẾT LẬP THÔNG BÁO NHẮC NHỞ
                  </label>
                  <div className="relative">
                    <Bell className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <select
                      value={formData.reminder || "none"}
                      onChange={(e) =>
                        setFormData({ ...formData, reminder: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none appearance-none bg-white text-sm font-medium text-slate-700"
                    >
                      <option value="none">Không nhắc nhở</option>
                      <option value="15min">15 phút trước giờ diễn ra</option>
                      <option value="1hour">1 tiếng trước giờ diễn ra</option>
                      <option value="1day">1 ngày trước ngày bắt đầu</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Members Involved */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                  <Users size={14} className="text-slate-400" /> Thành viên văn phòng tham gia
                </label>
                
                {/* Trigger Box */}
                <div 
                  onClick={() => setShowMembersDropdown(!showMembersDropdown)}
                  className="w-full min-h-[46px] px-4 py-2 border border-slate-200 rounded-xl bg-white flex justify-between items-center cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-[#0a2d37] outline-none transition-all shadow-sm group"
                >
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {(formData.participants || []).length === 0 ? (
                      <span className="text-slate-400 text-xs font-medium">Chọn hoặc nhập thành viên...</span>
                    ) : (
                      <span className="text-xs font-bold text-[#0a2d37] bg-[#0a2d37]/10 px-2.5 py-1 rounded-lg">
                        Đã chọn {(formData.participants || []).length} thành viên tham gia
                      </span>
                    )}
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-300 shrink-0 ml-2 ${showMembersDropdown ? "rotate-180" : ""}`} />
                </div>

                {/* Selected Members Cards Grid */}
                {(formData.participants || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {(formData.participants || []).map((pName: string) => {
                      const m = staffList.find((x) => x.name === pName);
                      return (
                        <div 
                          key={pName}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-center items-center text-center shadow-sm relative group hover:border-[#0a2d37]/40 transition-all"
                        >
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = (formData.participants || []).filter((p: string) => p !== pName);
                              setFormData({ ...formData, participants: updated });
                            }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Xóa thành viên"
                          >
                            <X size={10} />
                          </button>
                          
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-extrabold text-[10px] mb-1.5 shadow-sm">
                            {pName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">{pName}</span>
                          <span className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md">
                            {m?.role || "NS"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown Popover */}
                {showMembersDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        setShowMembersDropdown(false);
                        setMemberSearch("");
                      }} 
                    />
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 max-h-[350px] overflow-y-auto divide-y divide-slate-100/50 animate-fade-in-up flex flex-col">
                      {/* Search Bar inside popover */}
                      <div className="p-2 shrink-0">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm tài khoản..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-[#0a2d37] transition-all"
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto flex-1 max-h-60">
                        {/* Select All option */}
                        {memberSearch === "" && (
                          <div className="p-1">
                            <button
                              type="button"
                              onClick={() => {
                                const allNames = staffList.map(s => s.name);
                                const isAllSelected = (formData.participants || []).length === allNames.length;
                                setFormData({
                                  ...formData,
                                  participants: isAllSelected ? [] : allNames
                                });
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-[#e9c46a] text-white flex items-center justify-center font-bold text-[9px] shadow-inner">
                                  All
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">Chọn tất cả</p>
                                  <p className="text-[9px] text-slate-400">Tất cả tài khoản hệ thống</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(formData.participants || []).length === staffList.length}
                                  onChange={() => {}} // handled by onClick
                                  className="w-4 h-4 text-[#0a2d37] focus:ring-[#0a2d37] rounded border-slate-300 cursor-pointer pointer-events-none"
                                />
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Individual members */}
                        <div className="p-1 space-y-0.5">
                          {staffList
                            .filter((member) => 
                              memberSearch === "" || 
                              member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                              member.username.toLowerCase().includes(memberSearch.toLowerCase())
                            )
                            .map((member) => {
                              const currentParticipants = formData.participants || [];
                              const isSelected = currentParticipants.includes(member.name);
                              return (
                                <button
                                  key={member.username}
                                  type="button"
                                  onClick={() => {
                                    let updated = [...currentParticipants];
                                    if (isSelected) {
                                      updated = updated.filter((p) => p !== member.name);
                                    } else {
                                      updated.push(member.name);
                                    }
                                    setFormData({ ...formData, participants: updated });
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-left cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${member.color} text-white flex items-center justify-center font-bold text-[9px] shadow-inner`}>
                                      {member.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                                        <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase tracking-wider">{member.role}</span>
                                      </div>
                                      <p className="text-[9px] text-slate-400">@{member.username}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}} // handled by onClick
                                      className="w-4 h-4 text-[#0a2d37] focus:ring-[#0a2d37] rounded border-slate-300 cursor-pointer pointer-events-none"
                                    />
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Description / Case Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                  <FileText size={14} className="text-slate-400" /> Nhật ký chi tiết / Ghi chú vụ việc
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Điền thông tin mô tả chi tiết, nội dung cuộc họp hoặc ghi chú quan trọng cho công việc này..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none text-slate-800 text-sm transition-all"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 shrink-0">
              {modalMode === "edit" ? (
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-1 text-sm cursor-pointer"
                >
                  <Trash2 size={16} /> Xóa sự kiện
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors text-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  className="px-6 py-2.5 bg-[#0a2d37] text-white hover:bg-[#0c3946] rounded-xl font-bold transition-all shadow-md text-sm cursor-pointer hover:shadow-lg active:scale-95"
                >
                  {modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                Lịch sử hoạt động sự kiện
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {history.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Chưa có lịch sử hoạt động nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50"
                    >
                      <div
                        className={`mt-1 shrink-0 ${h.action === "Thêm" ? "text-green-500" : h.action === "Xóa" ? "text-red-500" : "text-blue-500"}`}
                      >
                        {h.action === "Thêm" ? (
                          <Plus size={20} />
                        ) : h.action === "Xóa" ? (
                          <Trash2 size={20} />
                        ) : (
                          <CalendarIcon size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-800">
                          <span className="font-semibold">{h.user}</span> đã{" "}
                          <span
                            className={`font-semibold ${h.action === "Thêm" ? "text-green-600" : h.action === "Xóa" ? "text-red-600" : "text-blue-600"}`}
                          >
                            {h.action.toLowerCase()}
                          </span>{" "}
                          sự kiện:
                        </p>
                        <p className="text-base text-slate-900 font-semibold mt-1 mb-1">
                          {h.title}
                        </p>
                        <p className="text-xs text-slate-500">{h.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
