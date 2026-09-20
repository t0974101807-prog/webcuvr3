import test from 'node:test';
import assert from 'node:assert/strict';
import { filterNonAdminPersonnel, formatPersonnelLabel, isAdminAccount } from './personnelFilters';

test('filters out admin-like accounts by role, username, email, or title', () => {
  const list = [
    { id: 1, name: 'Quản trị viên', role: 'admin', username: 'admin', email: 'admin@firm.com', title: 'Quản trị viên' },
    { id: 2, name: 'Nguyễn Văn A', role: 'user', username: 'nva', email: 'nva@firm.com', title: 'Luật sư' },
    { id: 3, name: 'Trần Thị B', role: 'manager', username: 'ttb', email: 'ttb@firm.com', title: 'Quản lý chi nhánh' },
    { id: 4, name: 'Lê Văn C', role: 'user', username: 'admin-ops', email: 'lec@firm.com', title: 'Chuyên viên pháp lý' },
  ];

  const filtered = filterNonAdminPersonnel(list);
  assert.deepEqual(filtered.map((u) => u.id), [2, 3]);
});

test('detects admin identity even when fields are mixed', () => {
  assert.equal(isAdminAccount({ role: 'admin', username: 'staff1', email: 'staff1@firm.com', title: 'Chuyên viên' }), true);
  assert.equal(isAdminAccount({ role: 'user', username: 'staff1', email: 'staff1@firm.com', title: 'Quản trị hệ thống' }), true);
  assert.equal(isAdminAccount({ role: 'user', username: 'staff1', email: 'staff1@firm.com', title: 'Luật sư' }), false);
});

test('normalizes whitespace and casing before checking admin status', () => {
  assert.equal(isAdminAccount({ role: ' Admin ', username: 'staff1', email: 'staff1@firm.com', title: 'Chuyên viên' }), true);
  assert.equal(isAdminAccount({ role: 'user', username: '  admin  ', email: 'staff1@firm.com', title: 'Chuyên viên' }), true);
  assert.equal(isAdminAccount({ role: 'user', username: 'staff1', email: '  ADMIN@firm.com  ', title: 'Chuyên viên' }), true);
  assert.equal(isAdminAccount({ role: 'user', username: 'staff1', email: 'staff1@firm.com', title: '  Giám đốc  ' }), true);
});

test('formats labels consistently as Name (Title)', () => {
  assert.equal(formatPersonnelLabel({ name: 'Nguyễn Văn A', title: 'Luật sư' }), 'Nguyễn Văn A (Luật sư)');
  assert.equal(formatPersonnelLabel({ name: 'Trần Thị B', role: 'manager' }), 'Trần Thị B (Quản lý)');
});
