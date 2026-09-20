export const calculatePayrollTaxes = (gross: number, dependents: number) => {
  const baseSalary = 2340000;
  const regionMinWage = 4960000;
  const bhxh_bhyt_cap = baseSalary * 20;
  const bhtn_cap = regionMinWage * 20;

  const bhxh_bhyt =
    Math.min(gross, bhxh_bhyt_cap) * 0.08 +
    Math.min(gross, bhxh_bhyt_cap) * 0.015;
  const bhtn = Math.min(gross, bhtn_cap) * 0.01;
  const insurance = Math.round(bhxh_bhyt + bhtn);

  const personalDeduction = 15500000;
  const dependentDeduction = 6200000 * dependents;
  const taxableIncome = gross - insurance - personalDeduction - dependentDeduction;
  let tax = 0;

  if (taxableIncome > 0) {
    if (taxableIncome <= 10000000) {
      tax = taxableIncome * 0.05;
    } else if (taxableIncome <= 30000000) {
      tax = taxableIncome * 0.1 - 500000;
    } else if (taxableIncome <= 50000000) {
      tax = taxableIncome * 0.2 - 3500000;
    } else if (taxableIncome <= 80000000) {
      tax = taxableIncome * 0.28 - 7500000;
    } else {
      tax = taxableIncome * 0.35 - 13100000;
    }
  }

  return { insurance, tax: Math.round(tax) };
};

export const calculateFullPayroll = (data: any) => {
  const calcs = calculatePayrollTaxes(data.gross || 0, data.dependents || 0);
  data.insurance = calcs.insurance;
  data.tax = calcs.tax;

  const totalSalary =
    (data.gross || 0) +
    (data.food_allowance || 0) +
    (data.gas_allowance || 0) +
    (data.phone_allowance || 0);
  data.total_salary = totalSalary;
  data.net =
    totalSalary +
    (data.other_benefits || 0) +
    (data.bonus || 0) -
    (data.violations || 0) -
    (data.insurance || 0) -
    (data.tax || 0);
  return data;
};
