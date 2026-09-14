export function validatePassword(password: string): string | null {
  if (!password) return "Mật khẩu không được để trống";
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/^[A-Z]/.test(password)) return "Chữ đầu tiên của mật khẩu phải viết hoa";
  if (!/[a-z]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ viết thường";
  if (!/[0-9]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ số";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt";
  return null;
}
