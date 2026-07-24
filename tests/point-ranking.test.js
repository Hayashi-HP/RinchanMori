const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const sheets = {
  users: {
    rows: [
      { employeeId:'A', name:'青木', dept:'病棟' },
      { employeeId:'B', name:'伊藤', dept:'外来' },
      { employeeId:'C', name:'上田', dept:'' }
    ]
  },
  point_transactions: {
    rows: [
      { employeeId:'A', amount:50, createdAt:'2026-07-23T01:00:00.000Z' },
      { employeeId:'A', amount:-20, createdAt:'2026-07-23T02:00:00.000Z' },
      { employeeId:'B', amount:10, createdAt:'2026-07-23T03:00:00.000Z' },
      { employeeId:'B', amount:25, createdAt:'2026-07-23T04:00:00.000Z' }
    ]
  }
};

const context = {
  console, Date, Error, Math, Object, Array, String, Number, JSON, isFinite,
  SHEET_USERS:'users',
  SHEET_POINT_TRANSACTIONS:'point_transactions',
  normalizeEmployeeId:value => String(value || '').trim(),
  readTable:sheet => sheet ? sheet.rows.map(row => ({ ...row })) : []
};
const ss = { getSheetByName:name => sheets[name] || null };

vm.createContext(context);
vm.runInContext(fs.readFileSync('apps-script/Point.gs', 'utf8'), context);

const ranking = context.getAdminPointBalanceRanking(ss);
assert.deepEqual(
  JSON.parse(JSON.stringify(ranking)),
  [
    {
      rank:1, employeeId:'B', name:'伊藤', dept:'外来',
      balance:35, totalEarned:35, lastTransactionAt:'2026-07-23T04:00:00.000Z'
    },
    {
      rank:2, employeeId:'A', name:'青木', dept:'病棟',
      balance:30, totalEarned:50, lastTransactionAt:'2026-07-23T02:00:00.000Z'
    },
    {
      rank:3, employeeId:'C', name:'上田', dept:'所属未設定',
      balance:0, totalEarned:0, lastTransactionAt:''
    }
  ]
);

console.log('point ranking: ok');
