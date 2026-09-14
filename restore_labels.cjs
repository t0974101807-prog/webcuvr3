const fs = require('fs');
let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

content = content.replace(/manageUsers:\s*"QUẢN LÝ LỊCH & SỰ KIỆN"/, 'manageUsers: "QUẢN LÝ NGƯỜI DÙNG"');
content = content.replace(/viewAllRecords:\s*"QUẢN LÝ VĂN BẢN PL"/, 'viewAllRecords: "XEM TẤT CẢ HỒ SƠ"');
content = content.replace(/editAllRecords:\s*"QUẢN LÝ HỒ SƠ QR"/, 'editAllRecords: "SỬA TẤT CẢ HỒ SƠ"');
content = content.replace(/deleteRecords:\s*"SỬ DỤNG TRỢ LÝ AI"/, 'deleteRecords: "XÓA HỒ SƠ"');
content = content.replace(/viewReports:\s*"QUẢN LÝ THÔNG BÁO"/, 'viewReports: "XEM BÁO CÁO"');
content = content.replace(/manageWeb:\s*"QUẢN LÝ LOẠI HỒ SƠ"/, 'manageWeb: "QUẢN LÝ NỘI DUNG WEB"');
content = content.replace(/manageFinance:\s*"PHÂN QUYỀN HỆ THỐNG"/, 'manageFinance: "QUẢN LÝ TÀI CHÍNH"');
content = content.replace(/viewPersonalRecords:\s*"CÀI ĐẶT HỆ THỐNG"/, 'viewPersonalRecords: "XEM HỒ SƠ CÁ NHÂN"');

content = content.replace(/manageUsers:\s*"MANAGE EVENTS"/, 'manageUsers: "MANAGE USERS"');
content = content.replace(/viewAllRecords:\s*"MANAGE LEGAL DOCS"/, 'viewAllRecords: "VIEW ALL RECORDS"');
content = content.replace(/editAllRecords:\s*"MANAGE QR PROFILES"/, 'editAllRecords: "EDIT ALL RECORDS"');
content = content.replace(/deleteRecords:\s*"USE AI ASSISTANT"/, 'deleteRecords: "DELETE RECORDS"');
content = content.replace(/viewReports:\s*"MANAGE NOTIFICATIONS"/, 'viewReports: "VIEW REPORTS"');
content = content.replace(/manageWeb:\s*"MANAGE RECORD TYPES"/, 'manageWeb: "MANAGE WEB CONTENT"');
content = content.replace(/manageFinance:\s*"MANAGE PERMISSIONS"/, 'manageFinance: "MANAGE FINANCES"');
content = content.replace(/viewPersonalRecords:\s*"SYSTEM SETTINGS"/, 'viewPersonalRecords: "VIEW PERSONAL RECORDS"');

fs.writeFileSync('src/components/ERP.tsx', content);
