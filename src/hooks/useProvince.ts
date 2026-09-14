import { useMemo } from "react";
import { provinceService } from "../services/provinceService";

export function useProvince(code: string) {
  const provinces = useMemo(
    () => provinceService.getAll(),
    []
  );
  const wards = useMemo(
    () => provinceService.getWards(code),
    [code]
  );
  return {
    provinces,
    wards
  };
}
