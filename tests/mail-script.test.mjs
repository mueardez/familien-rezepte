import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('Gmail scheduler honours due status, retains deduplication and replaces only its own triggers', () => {
  const stored = new Map([['POLL_DISPATCH_SECRET', 'test-secret-0123456789012345678901234567']]);
  const mails = []; const deleted = []; let interval; let due = false;
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => stored.get(key), setProperty: (key, value) => stored.set(key, value) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    UrlFetchApp: { fetch: (_url, options) => { assert.equal(JSON.parse(options.payload).scheduled, true); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ due, week: '2026-10-05', recipients: due ? ['one@example.com', 'two@example.com'] : [], url: 'https://example.com/abstimmung', htmlBody: '<h1>Was kommt auf den Tisch?</h1>' }) }; } },
    MailApp: { sendEmail: mail => mails.push(mail) },
    ScriptApp: { getProjectTriggers: () => ['sendFridayPoll', 'sendScheduledPoll', 'unrelatedJob'].map(name => ({ getHandlerFunction: () => name })), deleteTrigger: trigger => deleted.push(trigger.getHandlerFunction()), newTrigger: name => ({ timeBased: () => ({ everyMinutes: minutes => ({ create: () => { interval = { name, minutes }; } }) }) }) },
  });
  vm.runInContext(fs.readFileSync(new URL('../scripts/google-vote-mail.gs', import.meta.url), 'utf8'), context);
  vm.runInContext('sendScheduledPoll()', context); assert.equal(mails.length, 0);
  due = true; vm.runInContext('sendScheduledPoll(); sendScheduledPoll()', context); assert.equal(mails.length, 2);
  assert.equal(mails[0].htmlBody, '<h1>Was kommt auf den Tisch?</h1>');
  assert.match(mails[0].body, /https:\/\/example.com\/abstimmung/);
  vm.runInContext('installMailTrigger()', context); assert.deepEqual(deleted, ['sendFridayPoll', 'sendScheduledPoll']); assert.deepEqual(interval, { name: 'sendScheduledPoll', minutes: 5 });
});
