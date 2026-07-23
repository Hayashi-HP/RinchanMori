const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function atLocalNoon(daysAgo) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function loadMori(sentThanks) {
  const values = {
    rinchanSentThanks: sentThanks || [],
    rinchanParticipant: { employeeId: 'ME', name: '自分' }
  };
  const storage = {
    readJson: (key, fallback) => key in values ? values[key] : fallback,
    writeJson: (key, value) => {
      values[key] = value;
      return value;
    },
    getParticipant: () => values.rinchanParticipant,
    deviceId: () => 'test-device'
  };
  const context = {
    console,
    Date,
    Math,
    Object,
    Array,
    String,
    Number,
    isFinite,
    setTimeout() {},
    requestAnimationFrame() {},
    RinchanStorage: storage,
    localStorage: {
      getItem: key => key in values ? JSON.stringify(values[key]) : null,
      setItem: (key, value) => { values[key] = JSON.parse(value); }
    },
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      body: { appendChild() {} }
    },
    window: {
      RinchanStorage: storage,
      addEventListener() {},
      matchMedia: () => ({ matches: false }),
      CSS: { escape: value => value }
    }
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.localStorage = context.localStorage;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/features/mori.js', 'utf8'), context);
  return context.window.RinchanMori;
}

assert.equal(loadMori([]).thanksSendStatus('A').allowed, true);

{
  const status = loadMori([
    { toParticipantId: 'A', createdAt: atLocalNoon(0) }
  ]).thanksSendStatus('A');
  assert.equal(status.reason, 'sent_today');
  assert.equal(status.label, '送信しました');
}

{
  const status = loadMori([
    { toParticipantId: 'A', createdAt: atLocalNoon(2) }
  ]).thanksSendStatus('A');
  assert.equal(status.reason, 'cooldown');
  assert.equal(status.remaining, 5);
}

{
  const status = loadMori([
    { toParticipantId: 'A', createdAt: atLocalNoon(7) }
  ]).thanksSendStatus('A');
  assert.equal(status.allowed, true);
}

{
  const status = loadMori([
    { toParticipantId: 'A', createdAt: atLocalNoon(0) },
    { toParticipantId: 'B', createdAt: atLocalNoon(0) }
  ]).thanksSendStatus('C');
  assert.equal(status.reason, 'daily_limit');
  assert.equal(status.label, '本日は2人に送信済み');
}

console.log('mori thanks status: ok');
