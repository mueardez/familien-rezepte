import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMailSchedule, normalizeMailSchedule, duePollWeek } from '../app/lib/mail-schedule.ts';

test('Swiss schedule respects summer and winter offsets and never sends early', () => {
  assert.equal(duePollWeek(defaultMailSchedule, new Date('2026-10-02T14:59:00Z')), null);
  assert.equal(duePollWeek(defaultMailSchedule, new Date('2026-10-02T15:00:00Z')), '2026-10-05');
  assert.equal(duePollWeek(defaultMailSchedule, new Date('2026-10-30T15:59:00Z')), null);
  assert.equal(duePollWeek(defaultMailSchedule, new Date('2026-10-30T16:04:00Z')), '2026-11-02');
});
test('Sunday midnight retries keep the original target week; Monday targets next Monday', () => {
  assert.equal(duePollWeek({ weekday: 0, time: '23:59', enabled: true }, new Date('2026-10-04T22:03:00Z')), '2026-10-05');
  assert.equal(duePollWeek({ weekday: 1, time: '09:00', enabled: true }, new Date('2026-10-05T07:01:00Z')), '2026-10-12');
});
test('paused schedules and old missed invitations do not send; inputs are strict', () => {
  assert.equal(duePollWeek({ ...defaultMailSchedule, enabled: false }, new Date('2026-10-02T15:00:00Z')), null);
  assert.equal(duePollWeek(defaultMailSchedule, new Date('2026-10-04T15:00:00Z')), null);
  for (const bad of [{ weekday: 7, time: '12:00', enabled: true }, { weekday: 1, time: '24:00', enabled: true }, { weekday: '1', time: '12:00', enabled: true }]) assert.throws(() => normalizeMailSchedule(bad));
});
