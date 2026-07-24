const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let stateReads = 0;
const context = {
  console, Date, Error, Math, Object, Array, String, Number, JSON,
  VERSION:'test',
  jsonOutput:value => value,
  saveActivity:(ss, data) => ({
    type:'inserted',
    activityId:data.activityId,
    participantId:data.employeeId,
    date:data.date,
    steps:Number(data.steps),
    savedSteps:Number(data.steps),
    inputSource:data.inputSource
  }),
  normalizeActivityInputSource:data => data.inputSource || 'manual',
  invalidateActivityCaches() {},
  writeLog() {},
  auditAction() {},
  awardDailyCheckinPoint:() => ({ granted:false, duplicate:true }),
  awardActivityPoints() {},
  recordPointSideEffectError() {},
  getUserState:() => {
    stateReads += 1;
    return { employeeId:'A' };
  }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('apps-script/Router.gs', 'utf8'), context);

const shortcutResult = context.handlePost('saveHealthSteps', {
  activityId:'shortcut-1',
  employeeId:'A',
  date:'2026-07-24',
  steps:4321
}, {});
assert.equal(shortcutResult.ok, true);
assert.equal(shortcutResult.saved.steps, 4321);
assert.equal(Object.prototype.hasOwnProperty.call(shortcutResult, 'state'), false);
assert.equal(stateReads, 0);

const appResult = context.handlePost('saveActivity', {
  activityId:'app-1',
  employeeId:'A',
  date:'2026-07-24',
  steps:5000,
  inputSource:'manual'
}, {});
assert.equal(appResult.ok, true);
assert.equal(appResult.state.employeeId, 'A');
assert.equal(stateReads, 1);

console.log('shortcut fast response: ok');
