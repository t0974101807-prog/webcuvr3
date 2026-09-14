import Database from "better-sqlite3";
const db = new Database("lawfirm.db");

// Read all payrolls
const payrolls = db.prepare('SELECT * FROM monthly_payrolls').all();

const calculatePayrollTaxes = (gross, dependents) => {
  const baseSalary = 2340000;
  const regionMinWage = 4960000;
  const bhxh_bhyt_cap = baseSalary * 20;
  const bhtn_cap = regionMinWage * 20;

  const bhxh_bhyt = Math.min(gross, bhxh_bhyt_cap) * 0.08 + Math.min(gross, bhxh_bhyt_cap) * 0.015;
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

for (const p of payrolls) {
  const calcs = calculatePayrollTaxes(p.gross || 0, p.dependents || 0);
  const total_salary = (p.gross || 0) + (p.food_allowance || 0) + (p.gas_allowance || 0) + (p.phone_allowance || 0);
  const net = total_salary + (p.other_benefits || 0) + (p.bonus || 0) - (p.violations || 0) - calcs.insurance - calcs.tax;
  
  db.prepare(`UPDATE monthly_payrolls SET insurance = ?, tax = ?, net = ?, total_salary = ? WHERE id = ?`).run(
    calcs.insurance, calcs.tax, net, total_salary, p.id
  );
  console.log(`Updated ID: ${p.id}, Gross: ${p.gross}, Old Tax: ${p.tax}, New Tax: ${calcs.tax}, New Insurance: ${calcs.insurance}`);
}
console.log("DB sync complete.");
