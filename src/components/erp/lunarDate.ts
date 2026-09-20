export const getLunarDate = (year: number, month: number, day: number) => {
  let lunarDay = day - 5;
  let lunarMonth = month + 1;
  if (lunarDay <= 0) {
    lunarMonth -= 1;
    if (lunarMonth <= 0) lunarMonth = 12;
    lunarDay += 30;
  }
  return { day: lunarDay, month: lunarMonth };
};
