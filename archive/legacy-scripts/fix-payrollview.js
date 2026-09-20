const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const t = `          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0 bg-white rounded-lg">`;

const r = `          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
            {/* INJECT CALC */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0 bg-white rounded-lg">`;

code = code.replace(t, r);

const tCalc = `{/* INJECT CALC */}`;
const rCalc = `{(() => {
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

code = code.replace(tCalc, rCalc);

// Now fix the fields `total_salary` and `net` display
code = code.replace(`{(selectedPayroll.total_salary || 0).toLocaleString(`, `{(selectedPayroll.total_salary_computed || 0).toLocaleString(`);
code = code.replace(`{(selectedPayroll.net || 0).toLocaleString("en-US")}`, `{(selectedPayroll.net_computed || 0).toLocaleString("en-US")}`);
code = code.replace(`numberToWords(selectedPayroll.net || 0)`, `numberToWords(selectedPayroll.net_computed || 0)`);


// Add "Số người phụ thuộc" in the form
const tRow4 = `{/* Row 3 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Kỳ lương (Tháng)" : "Month"}
                  </label>`;

const rRow4 = `{/* Row Extra */}
              <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                     {language === "vi" ? "Số người phụ thuộc" : "Dependents"}
                   </label>
                   <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                     {selectedPayroll.dependents || 0}
                   </div>
                 </div>
                 <div></div>
              </div>
              
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Kỳ lương (Tháng)" : "Month"}
                  </label>`;

code = code.replace(tRow4, rRow4);

fs.writeFileSync('src/components/ERP.tsx', code);
console.log('Fixed PayrollView!');
