import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesClientRecord } from './clientRecordLink';

test('matches a client record by phone and case id', () => {
  const user = { name: 'Khách hàng', phone: '0206896759', username: '0206896759', case_id: 'HS-2026-001' };
  const record = {
    client: 'Khách hàng',
    clientPhone: '0206896759',
    systemId: 'HS-2026-001',
    contractDetails: { requesterPhone: '0999999999' }
  };

  assert.equal(matchesClientRecord(record, user), true);
});

test('matches a client record by normalized name and phone when case id is blank', () => {
  const user = { name: 'Nguyễn Văn A', phone: '0901234567', username: '0901234567', case_id: '' };
  const record = {
    client: '  nguyễn văn a  ',
    clientPhone: '0901234567',
    contractDetails: { requesterPhone: '0909876543' },
    id: 'CASE-1'
  };

  assert.equal(matchesClientRecord(record, user), true);
});

test('does not match unrelated client records', () => {
  const user = { name: 'Khách hàng', phone: '0206896759', username: '0206896759', case_id: '' };
  const record = {
    client: 'Nguyễn Văn B',
    clientPhone: '0900000000',
    systemId: 'HS-2026-999'
  };

  assert.equal(matchesClientRecord(record, user), false);
});
