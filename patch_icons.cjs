const fs = require('fs');

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// The typical gradient we applied earlier:
const staticGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600';
const dynamicGradient = 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-gradient';

// Instead of regex for everything, let's use exact string replace for the "Tạo mã" button classes
const oldTaoMaClass = "\\${formData.contractId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 transition-all duration-300 hover:bg-blue-100'}";
const newTaoMaClass = "\\${formData.contractId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient text-white shadow-md hover:opacity-90'}";

content = content.replace(oldTaoMaClass, newTaoMaClass);

const oldTaoMaClass2 = "\\${formData.authContractId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 transition-all duration-300 hover:bg-blue-100'}";
const newTaoMaClass2 = "\\${formData.authContractId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient text-white shadow-md hover:opacity-90'}";

content = content.replace(oldTaoMaClass2, newTaoMaClass2);

// Eye icon inside input
const eyeIconInInput = `className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all duration-300 active:scale-95"`;
const newEyeIconInInput = `className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:bg-clip-text transition-all duration-300 active:scale-95"`;
content = content.replace(eyeIconInInput, newEyeIconInInput);
content = content.replace(eyeIconInInput, newEyeIconInInput);


// Now for the icons in view mode:
const eyeIconStr1 = 'className="text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95 p-1" title="Xem chi tiết"';
const newEyeIconStr1 = 'className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white text-slate-400 transition-all duration-300 active:scale-95" title="Xem chi tiết"';
content = content.replace(eyeIconStr1, newEyeIconStr1);
content = content.replace(eyeIconStr1, newEyeIconStr1);

const downloadIconStr1 = 'className="text-blue-500 hover:text-blue-700 transition-all duration-300 active:scale-95 p-1" title="Tải xuống hợp đồng (mẫu)"';
const newDownloadIconStr1 = 'className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white text-blue-500 transition-all duration-300 active:scale-95" title="Tải xuống hợp đồng (mẫu)"';
content = content.replace(downloadIconStr1, newDownloadIconStr1);
content = content.replace(downloadIconStr1, newDownloadIconStr1);

const uploadIconStr1 = 'className="text-purple-500 hover:text-purple-700 transition-all duration-300 active:scale-95 p-1 cursor-pointer flex items-center justify-center relative overflow-hidden" title="Tải PDF lên để đóng dấu QR"';
const newUploadIconStr1 = 'className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white text-purple-500 transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center relative overflow-hidden" title="Tải PDF lên để đóng dấu QR"';
content = content.replace(uploadIconStr1, newUploadIconStr1);
content = content.replace(uploadIconStr1, newUploadIconStr1);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('patched icons and buttons');
