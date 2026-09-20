import test from "node:test";
import assert from "node:assert/strict";
import { calculateFullPayroll, calculatePayrollTaxes } from "./payrollCalculations";

test("calculates insurance and PIT using the ERP payroll formula", () => {
  assert.deepEqual(calculatePayrollTaxes(50_000_000, 0), {
    insurance: 4_946_000,
    tax: 2_455_400,
  });
});

test("calculates full payroll without changing the existing salary fields", () => {
  const payroll = calculateFullPayroll({
    gross: 50_000_000,
    food_allowance: 1_000_000,
    gas_allowance: 500_000,
    phone_allowance: 500_000,
    other_benefits: 250_000,
    bonus: 1_000_000,
    violations: 100_000,
    dependents: 0,
  });

  assert.equal(payroll.total_salary, 52_000_000);
  assert.equal(payroll.insurance, 4_946_000);
  assert.equal(payroll.tax, 2_455_400);
  assert.equal(payroll.net, 45_748_600);
});
