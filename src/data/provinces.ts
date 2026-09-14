import provincesData from "./vn_only_simplified_json_generated_data_vn_units.json";

export interface Ward {
  Code: string;
  FullName: string;
  ProvinceCode: string;
}

export interface Province {
  Code: string;
  FullName: string;
  Wards: Ward[];
}

// Tự động đồng bộ hóa và bổ sung ProvinceCode vào từng Ward một cách linh hoạt
export const PROVINCES_DATA: Province[] = (provincesData as any[]).map((prov) => {
  const provinceCode = prov.Code;
  return {
    Code: prov.Code,
    FullName: prov.FullName,
    Wards: (prov.Wards || []).map((w: any) => ({
      Code: w.Code,
      FullName: w.FullName,
      ProvinceCode: provinceCode,
    })),
  };
});

