import React, { useRef } from "react";
import { Plus, FileSpreadsheet, Briefcase, LucideIcon, Scale, Users, Shield, Gavel } from "lucide-react";
import { Header } from "../../../components/shared/Header";
import { getModuleByActiveTab } from "../../../config/modules";
import { SpecializedRecordsService } from "../services/SpecializedRecordsService";
import { RecordItem } from "../repository/SpecializedRecordsRepository";

interface ModuleHeaderProps {
  activeModule: string;
  language: "vi" | "en";
  currentUser: any;
  onAddClick: () => void;
  onImportSuccess: (parsedRecords: RecordItem[]) => void;
  onExportClick: () => void;
  onExportCSVClick: () => void;
}

// Icon mapper for lucide-react dynamic strings
const IconMap: Record<string, LucideIcon> = {
  Scale,
  Users,
  Shield,
  Gavel,
  Briefcase,
};

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  activeModule,
  language,
  currentUser,
  onAddClick,
  onImportSuccess,
  onExportClick,
  onExportCSVClick,
}) => {
  const moduleConfig = getModuleByActiveTab(activeModule);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const IconComp = IconMap[moduleConfig.icon] || Briefcase;

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const records = await SpecializedRecordsService.parseExcelFile(
          file,
          currentUser,
          activeModule,
          moduleConfig.category
        );
        onImportSuccess(records);
        const resolvedName = language === "vi" ? moduleConfig.nameVi : moduleConfig.nameEn;
        alert(
          language === "vi"
            ? `Nhập thành công ${records.length} hồ sơ ${resolvedName} từ file!`
            : `Successfully imported ${records.length} ${resolvedName} records!`
        );
      } catch (err: any) {
        console.error(err);
        if (err.message === "no_data") {
          alert(language === "vi" ? "File không có dữ liệu!" : "File contains no data!");
        } else {
          alert(language === "vi" ? "Đã có lỗi xảy ra khi đọc file!" : "Error parsing file!");
        }
      }
    }
  };

  const headerActions = [
    {
      labelVi: "Nhập Excel/CSV",
      labelEn: "Import Excel/CSV",
      icon: FileSpreadsheet,
      onClick: () => fileInputRef.current?.click(),
      variant: "success" as const,
    },
    {
      labelVi: "Tải Excel (.xlsx)",
      labelEn: "Download Excel (.xlsx)",
      icon: FileSpreadsheet,
      onClick: onExportClick,
      variant: "secondary" as const,
    },
    {
      labelVi: "Tải CSV (.csv)",
      labelEn: "Download CSV (.csv)",
      icon: FileSpreadsheet,
      onClick: onExportCSVClick,
      variant: "secondary" as const,
    },
    {
      labelVi: "Thêm hồ sơ mới",
      labelEn: "Add Dossier",
      icon: Plus,
      onClick: onAddClick,
      variant: "primary" as const,
    },
  ];

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <Header
        titleVi={moduleConfig.nameVi}
        titleEn={moduleConfig.nameEn}
        descriptionVi={moduleConfig.descriptionVi}
        descriptionEn={moduleConfig.descriptionEn}
        icon={IconComp}
        actions={headerActions}
        language={language}
      />
    </>
  );
};
