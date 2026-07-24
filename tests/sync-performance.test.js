const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const values = new Map();
values.set('rinchanParticipant', JSON.stringify({ employeeId:'A', name:'テスト' }));
const listeners = {};
const calls = [];

const context = {
  console, Date, Error, Math, Object, Array, String, Number, JSON, Set, Promise,
  setTimeout, clearTimeout,
  localStorage:{
    getItem:key => values.has(key) ? values.get(key) : null,
    setItem:(key, value) => values.set(key, String(value)),
    removeItem:key => values.delete(key)
  },
  document:{
    visibilityState:'visible',
    addEventListener:(name, handler) => { listeners['document:' + name] = handler; },
    querySelector:() => null,
    getElementById:() => null
  },
  RinchanStorage:{
    readJson(key, fallback) {
      try { return values.has(key) ? JSON.parse(values.get(key)) : fallback; } catch (e) { return fallback; }
    },
    writeJson(key, value) {
      values.set(key, JSON.stringify(value));
      return value;
    },
    getParticipant() {
      return JSON.parse(values.get('rinchanParticipant'));
    },
    employeeId() { return 'A'; }
  },
  RinchanApi:{
    async request(action) {
      calls.push(action);
      await new Promise(resolve => setTimeout(resolve, 5));
      if (action === 'getUserState') {
        return {
          ok:true,
          state:{
            employeeId:'A',
            user:{ employeeId:'A', name:'テスト' },
            activities:[{ activityId:'old', participantId:'A', date:'2026-07-24', steps:100 }],
            syncToken:'one'
          }
        };
      }
      if (action === 'activitySnapshot') {
        return {
          ok:true,
          activities:[{ activityId:'new', participantId:'A', date:'2026-07-24', steps:4321 }]
        };
      }
      return { ok:false };
    }
  }
};
context.window = context;
context.window.addEventListener = (name, handler) => { listeners['window:' + name] = handler; };

vm.createContext(context);
vm.runInContext(fs.readFileSync('js/core/sync.js', 'utf8'), context);

(async () => {
  await Promise.all([
    context.RinchanSync.sync({ silent:true }),
    context.RinchanSync.sync({ silent:true })
  ]);
  assert.equal(calls.filter(action => action === 'getUserState').length, 1);

  await context.RinchanSync.refreshActivities({ force:true });
  assert.equal(calls.filter(action => action === 'activitySnapshot').length, 1);
  const activities = JSON.parse(values.get('rinchanActivities'));
  assert.equal(activities[0].steps, 4321);

  console.log('sync performance: ok');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
