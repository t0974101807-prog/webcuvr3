import React from 'react';

export function evaluatePasswordStrength(password: string) {
  let score = 0;
  if (!password) return { score: 0, label: '', color: 'bg-gray-200', textColors: 'text-gray-600' };

  if (password.length >= 8) score += 1;
  if (/^[A-Z]/.test(password)) score += 1; // Strict rule: must start with A-Z
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score < 3) return { score, label: 'Yếu (Quá đơn giản)', color: 'bg-red-500', textColors: 'text-red-500' };
  if (score < 5) return { score, label: 'Trung bình', color: 'bg-yellow-500', textColors: 'text-yellow-500' };
  return { score, label: 'Mạnh', color: 'bg-green-500', textColors: 'text-green-500' };
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, color, textColors } = evaluatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600">Độ mạnh mật khẩu:</span>
        <span className={`text-xs font-bold ${textColors}`}>{label}</span>
      </div>
      <div className="flex gap-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${score >= 1 ? color : 'bg-transparent'} transition-all`} style={{ width: '20%' }} />
        <div className={`h-full ${score >= 2 ? color : 'bg-transparent'} transition-all`} style={{ width: '20%' }} />
        <div className={`h-full ${score >= 3 ? color : 'bg-transparent'} transition-all`} style={{ width: '20%' }} />
        <div className={`h-full ${score >= 4 ? color : 'bg-transparent'} transition-all`} style={{ width: '20%' }} />
        <div className={`h-full ${score >= 5 ? color : 'bg-transparent'} transition-all`} style={{ width: '20%' }} />
      </div>
      <ul className="mt-2 text-xs text-gray-600 list-disc list-inside grid grid-cols-2 gap-1">
        <li className={password.length >= 8 ? 'text-green-600' : ''}>Ít nhất 8 ký tự</li>
        <li className={/^[A-Z]/.test(password) ? 'text-green-600' : ''}>Chữ đầu tiên viết hoa</li>
        <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>Có chữ thường</li>
        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>Có số</li>
        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'col-span-2'}>Có ký tự đặc biệt</li>
      </ul>
    </div>
  );
}
