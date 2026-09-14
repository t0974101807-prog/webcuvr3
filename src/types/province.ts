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
