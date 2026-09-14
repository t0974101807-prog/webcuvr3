const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const t = `{(() => {
              const gross = selectedPayroll.gross || 0;
              const food = selectedPayroll.food_allowance || 0;
              const gas = selectedPayroll.gas_allowance || 0;
              const phone = selectedPayroll.phone_allowance || 0;
              const other = selectedPayroll.other_benefits || 0;
              const bonus = selectedPayroll.bonus || 0;
              const violations = selectedPayroll.violations || 0;
              const insurance = selectedPayroll.insurance || 0;
              const tax = selectedPayroll.tax || 0;
              const totalSalary = gross + food + gas + phone;
              const netSalary = totalSalary + other + bonus - violations - insurance - tax;
              selectedPayroll.total_salary_computed = totalSalary;
              selectedPayroll.net_computed = netSalary;
              return null;
            })()}`;

const r = `{(() => {
              const gross = selectedPayroll.gross || 0;
              const food = selectedPayroll.food_allowance || 0;
              const gas = selectedPayroll.gas_allowance || 0;
              const phone = selectedPayroll.phone_allowance || 0;
              const other = selectedPayroll.other_benefits || 0;
              const bonus = selectedPayroll.bonus || 0;
              const violations = selectedPayroll.violations || 0;
              const dependents = selectedPayroll.dependents || 0;

              // Synchronize calculation with renderTaxDetails
              const baseSalary = 2340000;
              const regionMinWage = 4960000;
              const bhxh_bhyt_cap = baseSalary * 20;
              const bhtn_cap = regionMinWage * 20;
              const bhxh = Math.round(Math.min(gross, bhxh_bhyt_cap) * 0.08);
              const bhyt = Math.round(Math.min(gross, bhxh_bhyt_cap) * 0.015);
              const bhtn = Math.round(Math.min(gross, bhtn_cap) * 0.01);
              const insurance = bhxh + bhyt + bhtn;

              const personalDeduction = 15500000;
              const dependentDeduction = 6200000 * dependents;
              const incomeBeforeTax = gross - insurance;
              const taxableIncome = Math.max(0, incomeBeforeTax - personalDeduction - dependentDeduction);
              
              const taxBrackets = [
                { rate: 5, max: 10000000 },
                { rate: 10, max: 20000000 },
                { rate: 20, max: 20000000 },
                { rate: 28, max: 30000000 },
                { rate: 35, max: Infinity },
              ];
              let remainingTaxable = taxableIncome;
              let tax = 0;
              taxBrackets.forEach((b) => {
                const amountInBracket = Math.min(remainingTaxable, b.max);
                const taxInBracket = amountInBracket * (b.rate / 100);
                remainingTaxable -= amountInBracket;
                if (remainingTaxable < 0) remainingTaxable = 0;
                tax += taxInBracket;
              });

              // Overwrite selectedPayroll for UI fields
              selectedPayroll.insurance_computed = insurance;
              selectedPayroll.tax_computed = Math.round(tax);
              
              const totalSalary = gross + food + gas + phone;
              const netSalary = totalSalary + other + bonus - violations - insurance - tax;
              selectedPayroll.total_salary_computed = totalSalary;
              selectedPayroll.net_computed = netSalary;
              return null;
            })()}`;

if (code.includes(t)) {
  code = code.replace(t, r);
  console.log("Replaced calculation successfully.");
} else {
  console.log("Could not find the target calculation block in ERP.tsx.");
}

// 2. We also need to update the top summary to use insurance_computed and tax_computed
const insOld = `{(selectedPayroll.insurance || 0).toLocaleString("en-US")}`;
const insNew = `{(selectedPayroll.insurance_computed ?? selectedPayroll.insurance ?? 0).toLocaleString("en-US")}`;

const taxOld = `{(selectedPayroll.tax || 0).toLocaleString("en-US")}`;
const taxNew = `{(selectedPayroll.tax_computed ?? selectedPayroll.tax ?? 0).toLocaleString("en-US")}`;

// Make sure to only replace inside the modal
let foundError = false;
if (code.includes(insOld)) {
  code = code.replace(insOld, insNew);
  console.log("Replaced insurance rendering.");
}
if (code.includes(taxOld)) {
  code = code.replace(taxOld, taxNew);
  console.log("Replaced tax rendering.");
}

fs.writeFileSync('src/components/ERP.tsx', code);
