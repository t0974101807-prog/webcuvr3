import { PROVINCES_DATA } from "../data/provinces";
import { Province } from "../types/province";

export const provinceService = {
  getAll(): Province[] {
    return PROVINCES_DATA;
  },
  getProvince(code: string) {
    return PROVINCES_DATA.find(
      p => p.Code === code
    );
  },
  getWards(code: string) {
    const province = this.getProvince(code);
    return province?.Wards ?? [];
  }
};
