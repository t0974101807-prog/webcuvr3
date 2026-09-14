export function numberToWords(number: number): string {
  if (number === 0) return 'Không đồng';
  
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  
  function readGroup(group: number, full: boolean): string {
    let result = '';
    const hundred = Math.floor(group / 100);
    const ten = Math.floor((group % 100) / 10);
    const unit = group % 10;
    
    if (full || hundred > 0) {
      result += digits[hundred] + ' trăm ';
    }
    
    if (ten === 0 && hundred > 0 && unit > 0) {
      result += 'lẻ ';
    } else if (ten === 1) {
      result += 'mười ';
    } else if (ten > 1) {
      result += digits[ten] + ' mươi ';
    }
    
    if (unit === 1 && ten > 1) {
      result += 'mốt ';
    } else if (unit === 5 && ten > 0) {
      result += 'lăm ';
    } else if (unit > 0 || (unit === 0 && ten === 0 && hundred === 0 && !full)) {
      if (unit > 0) {
        result += digits[unit] + ' ';
      }
    }
    
    return result.trim();
  }
  
  let result = '';
  let groupIndex = 0;
  let num = Math.abs(number);
  
  while (num > 0) {
    const group = num % 1000;
    num = Math.floor(num / 1000);
    
    if (group > 0) {
      const groupText = readGroup(group, num > 0);
      result = groupText + ' ' + units[groupIndex] + ' ' + result;
    }
    
    groupIndex++;
  }
  
  result = result.trim() + ' đồng';
  if (number < 0) {
    result = 'Âm ' + result;
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1);
}
