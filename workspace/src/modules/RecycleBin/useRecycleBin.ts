import { useState, useEffect, useCallback } from "react";

export type RecordCategory = "Tranh tụng" | "Tư vấn Pháp luật" | "Đại diện Ngoài tố tụng" | "Pháp chế & Nội bộ";

export interface TrashRecord {
  id: string;
  code: string;
  category: RecordCategory;
  title: string;
  clientName: string;
  serviceFee: number;
  assignee: string;
  deletedBy: string;
  deletedAt: string; // ISO string
  expiresInDays: number;
  expiresInHours: number;
  read: boolean;
  parentFolderDeleted: boolean;
}

export interface UseRecycleBinReturn {
  records: TrashRecord[];
  loading: boolean;
  error: string | null;
  fetchTrashItems: () => Promise<void>;
  restoreItems: (ids: string[], resolutionType?: "DEFAULT" | "RECREATE_PARENT") => Promise<boolean>;
  permanentDeleteItems: (ids: string[], verificationText: string, otpCode?: string) => Promise<boolean>;
  emptyTrash: (verificationText: string, otpCode?: string) => Promise<boolean>;
}

/**
 * Custom Hook: useRecycleBin
 * Integrates directly with the Lawfirm ERP TrashService to fetch, restore, and purge trash items.
 */
export function useRecycleBin(): UseRecycleBinReturn {
  const [records, setRecords] = useState<TrashRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. FETCH TRASH ITEMS
  const fetchTrashItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trash/items", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trash items: ${response.statusText}`);
      }

      const data = await response.json();
      setRecords(data.items || []);
    } catch (err: any) {
      console.error("Error in fetchTrashItems:", err);
      setError(err.message || "An unknown error occurred while loading recycle bin items.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. BULK RESTORATION
  const restoreItems = useCallback(async (
    ids: string[],
    resolutionType: "DEFAULT" | "RECREATE_PARENT" = "DEFAULT"
  ): Promise<boolean> => {
    if (ids.length === 0) return false;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trash/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseIds: ids,
          resolutionType,
          reason: "Khôi phục hồ sơ qua giao diện người dùng",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to restore records.");
      }

      // Cập nhật lại state cục bộ sau khi khôi phục thành công để giảm tải gọi mạng
      setRecords((prev) => prev.filter((r) => !ids.includes(r.id)));
      return true;
    } catch (err: any) {
      console.error("Error in restoreItems:", err);
      setError(err.message || "Failed to restore selected items.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. BULK PERMANENT DELETION (Hard Delete)
  const permanentDeleteItems = useCallback(async (
    ids: string[],
    verificationText: string,
    otpCode?: string
  ): Promise<boolean> => {
    if (ids.length === 0) return false;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trash/hard-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseIds: ids,
          verification: verificationText,
          otp: otpCode,
          reason: "Xóa vĩnh viễn và giải phóng ổ đĩa lưu trữ đám mây qua giao diện người dùng",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to hard-delete records.");
      }

      setRecords((prev) => prev.filter((r) => !ids.includes(r.id)));
      return true;
    } catch (err: any) {
      console.error("Error in permanentDeleteItems:", err);
      setError(err.message || "Failed to permanently delete selected items.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. EMPTY TRASH (Purge Everything)
  const emptyTrash = useCallback(async (
    verificationText: string,
    otpCode?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trash/empty", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification: verificationText,
          otp: otpCode,
          reason: "Dọn dẹp làm sạch toàn bộ Thùng rác Hệ thống",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to empty recycle bin.");
      }

      setRecords([]);
      return true;
    } catch (err: any) {
      console.error("Error in emptyTrash:", err);
      setError(err.message || "Failed to empty the recycle bin.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động tải dữ liệu lần đầu tiên khởi chạy hook
  useEffect(() => {
    fetchTrashItems();
  }, [fetchTrashItems]);

  return {
    records,
    loading,
    error,
    fetchTrashItems,
    restoreItems,
    permanentDeleteItems,
    emptyTrash,
  };
}
