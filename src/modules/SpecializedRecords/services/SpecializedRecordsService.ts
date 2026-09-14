import * as XLSX from "xlsx";
import { RecordItem } from "../repository/SpecializedRecordsRepository";

export class SpecializedRecordsService {
  /**
   * Calculate statistic metrics for specialized module records
   */
  public static calculateStats(records: RecordItem[]) {
    const totalCount = records.length;
    const inProgressCount = records.filter(
      (r) => r.status === "Đang giải quyết" || r.status === "In Progress"
    ).length;
    const completedCount = records.filter(
      (r) => r.status === "Hoàn thành" || r.status === "Completed"
    ).length;
    
    const totalRevenue = records.reduce((sum, r) => {
      const val = (r.feeAmount || r.revenue || "0")
        .toString()
        .replace(/,/g, "");
      return sum + (Number(val) || 0);
    }, 0);

    return {
      totalCount,
      inProgressCount,
      completedCount,
      totalRevenue,
    };
  }

  /**
   * Validates form inputs for a specialized record
   */
  public static validateRecord(formData: Partial<RecordItem>): string | null {
    if (!formData.title?.trim()) {
      return "title_required";
    }
    return null;
  }

  /**
   * Parse uploaded Excel spreadsheet file into RecordItems
   */
  public static parseExcelFile(
    file: File,
    currentUser: any,
    activeModule: string,
    moduleCategory: string
  ): Promise<RecordItem[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);

          if (!data || data.length === 0) {
            reject(new Error("no_data"));
            return;
          }

          const parsedRecords: RecordItem[] = data.map((row: any) => {
            const newId = Date.now().toString() + Math.floor(Math.random() * 1000);
            const rawFee = row["Phí dịch vụ"] || row["Fee"] || row["Doanh thu"] || row["Số tiền thanh lý (VND)"] || row["Số tiền thanh lý"] || "0";
            return {
              id: newId,
              title: row["Tên hồ sơ"] || row["Tên vụ việc"] || row["Subject"] || row["Tiêu đề"] || row["Mô tả"] || "Hồ sơ tư vấn",
              client: row["Khách hàng"] || row["Client"] || row["Tên khách hàng"] || "Khách hàng mới",
              clientPhone: row["Điện thoại KH"] || row["Điện thoại"] || row["Phone"] || "",
              address: row["Địa chỉ"] || row["Address"] || "null",
              dob: row["Ngày sinh"] || row["DOB"] || "15/06/1990",
              gender: row["Giới tính"] || row["Gender"] || "Nam",
              overdueAmount: row["Số tiền quá hạn (VND)"] || row["Số tiền quá hạn"] || row["Overdue Amount"] || 0,
              liquidationAmount: row["Số tiền thanh lý (VND)"] || row["Số tiền thanh lý"] || row["Liquidation Amount"] || rawFee,
              loanStatus: row["Tình trạng khoản vay"] || row["Tình trạng"] || row["Loan Status"] || "null",
              feeAmount: rawFee,
              status: row["Trạng thái"] || row["Status"] || "Mới tiếp nhận",
              mainAssignee: row["Người phụ trách"] || row["Chuyên viên"] || row["Assignee"] || currentUser?.name || "",
              description: row["Mô tả"] || row["Nội dung"] || row["Description"] || row["Mô tả / Nội dung tóm tắt"] || "",
              date: row["Ngày tiếp nhận"] || row["Ngày lập HS"] || row["Ngày tiếp nhận / Lập HS"] || new Date().toISOString().split("T")[0],
              practice_area: activeModule,
              category: moduleCategory,
              contractId: row["Số HĐ"] || row["Số HĐ / Mã hồ sơ"] || row["Mã hồ sơ"] || row["Contract ID"] || `930${Math.floor(Math.random() * 900000000000000 + 100000000000000)}`
            };
          });

          resolve(parsedRecords);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });
  }

  /**
   * Export RecordItems into an Excel spreadsheet file
   */
  public static exportExcelFile(records: RecordItem[], fileName: string) {
    const rows = records.map((r, idx) => ({
      "STT": idx + 1,
      "Số HĐ / Mã hồ sơ": r.contractId || r.id,
      "Tên khách hàng": r.client || "---",
      "Điện thoại KH": r.clientPhone || "---",
      "Địa chỉ": r.address || "null",
      "Ngày sinh": r.dob || "---",
      "Giới tính": r.gender || "---",
      "Số tiền quá hạn (VND)": r.overdueAmount !== undefined ? Number(r.overdueAmount) : 0,
      "Số tiền thanh lý (VND)": r.liquidationAmount !== undefined ? Number(r.liquidationAmount) : 0,
      "Tình trạng khoản vay": r.loanStatus || "null",
      "Người phụ trách": r.mainAssignee || "---",
      "Trạng thái": r.status || "Mới tiếp nhận",
      "Ngày tiếp nhận / Lập HS": r.date || "---",
      "Mô tả / Nội dung tóm tắt": r.description || "---"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách hồ sơ");
    
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Export RecordItems into a CSV text file with UTF-8 BOM encoding for Vietnamese language support
   */
  public static exportCSVFile(records: RecordItem[], fileName: string) {
    const headers = [
      "STT",
      "Số HĐ / Mã hồ sơ",
      "Tên khách hàng",
      "Điện thoại KH",
      "Địa chỉ",
      "Ngày sinh",
      "Giới tính",
      "Số tiền quá hạn (VND)",
      "Số tiền thanh lý (VND)",
      "Tình trạng khoản vay",
      "Người phụ trách",
      "Trạng thái",
      "Ngày tiếp nhận / Lập HS",
      "Mô tả / Nội dung tóm tắt"
    ];

    const rows = records.map((r, idx) => [
      idx + 1,
      r.contractId || r.id,
      r.client || "---",
      r.clientPhone || "---",
      r.address || "null",
      r.dob || "---",
      r.gender || "---",
      r.overdueAmount !== undefined ? Number(r.overdueAmount) : 0,
      r.liquidationAmount !== undefined ? Number(r.liquidationAmount) : 0,
      r.loanStatus || "null",
      r.mainAssignee || "---",
      r.status || "Mới tiếp nhận",
      r.date || "---",
      (r.description || "---").replace(/\n/g, " ").replace(/"/g, '""')
    ]);

    const csvContent = "\uFEFF" + [ // Add UTF-8 BOM
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate simulated Timeline events for a record to represent activity logging
   */
  public static getMockTimelineEvents(record: RecordItem) {
    return [
      {
        id: "ev1",
        titleVi: "Khởi tạo hồ sơ",
        titleEn: "Dossier Created",
        date: record.date || new Date().toLocaleDateString("vi-VN"),
        descriptionVi: `Hồ sơ '${record.title}' được đăng ký trên hệ thống bởi nhân viên phụ trách ${record.mainAssignee || "hệ thống"}.`,
        descriptionEn: `Dossier '${record.title}' registered by ${record.mainAssignee || "system"}.`,
        badgeVi: "Hệ thống",
        badgeEn: "System",
      },
      {
        id: "ev2",
        titleVi: "Phân loại chuyên môn",
        titleEn: "Practice Area Classification",
        date: record.date || new Date().toLocaleDateString("vi-VN"),
        descriptionVi: `Phân hệ đã được gán tự động vào danh mục '${record.category}'.`,
        descriptionEn: `Practice Area assigned to '${record.category}'.`,
        badgeVi: "Tự động",
        badgeEn: "Auto",
      },
    ];
  }
}
