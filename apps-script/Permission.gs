/* Permission and role management */

const ROLE_GENERAL = 'general';
const ROLE_LEADER = 'leader';
const ROLE_HEAD = 'head';
const ROLE_MANAGER = 'manager';
const ROLE_ADMIN = 'admin';
const ROLE_SYSTEM = 'system';

const PERMISSION_VIEW_ADMIN = 'view_admin';
const PERMISSION_VIEW_SYSTEM = 'view_system';
const PERMISSION_VIEW_DEPT = 'view_dept';
const PERMISSION_MANAGE_USERS = 'manage_users';
const PERMISSION_MANAGE_NEWS = 'manage_news';
const PERMISSION_MANAGE_CHALLENGES = 'manage_challenges';
const PERMISSION_MANAGE_BADGES = 'manage_badges';
const PERMISSION_EXPORT = 'export';

const ROLE_LEVELS = {};
ROLE_LEVELS[ROLE_GENERAL] = 10;
ROLE_LEVELS[ROLE_LEADER] = 20;
ROLE_LEVELS[ROLE_HEAD] = 30;
ROLE_LEVELS[ROLE_MANAGER] = 40;
ROLE_LEVELS[ROLE_ADMIN] = 90;
ROLE_LEVELS[ROLE_SYSTEM] = 100;

const ROLE_PERMISSIONS = {};
ROLE_PERMISSIONS[ROLE_GENERAL] = [];
ROLE_PERMISSIONS[ROLE_LEADER] = [PERMISSION_VIEW_DEPT];
ROLE_PERMISSIONS[ROLE_HEAD] = [PERMISSION_VIEW_DEPT, PERMISSION_EXPORT];
ROLE_PERMISSIONS[ROLE_MANAGER] = [PERMISSION_VIEW_ADMIN, PERMISSION_VIEW_DEPT, PERMISSION_EXPORT];
ROLE_PERMISSIONS[ROLE_ADMIN] = [PERMISSION_VIEW_ADMIN, PERMISSION_VIEW_SYSTEM, PERMISSION_VIEW_DEPT, PERMISSION_MANAGE_USERS, PERMISSION_MANAGE_NEWS, PERMISSION_MANAGE_CHALLENGES, PERMISSION_MANAGE_BADGES, PERMISSION_EXPORT];
ROLE_PERMISSIONS[ROLE_SYSTEM] = [PERMISSION_VIEW_ADMIN, PERMISSION_VIEW_SYSTEM, PERMISSION_VIEW_DEPT, PERMISSION_MANAGE_USERS, PERMISSION_MANAGE_NEWS, PERMISSION_MANAGE_CHALLENGES, PERMISSION_MANAGE_BADGES, PERMISSION_EXPORT];

function normalizeRole(role, adminFlag) {
  const raw = String(role || '').trim().toLowerCase();
  if (raw && ROLE_LEVELS[raw]) return raw;
  if (String(adminFlag || '').trim() === '1') return ROLE_ADMIN;
  return ROLE_GENERAL;
}

function getUserPermissionContext(ss, data) {
  const id = normalizeEmployeeId(data.employeeId || data.id || data.participantId || '');
  if (!id) return null;

  const user = readTable(ss.getSheetByName(SHEET_USERS))
    .find(row => normalizeEmployeeId(row.employeeId || row.id || '') === id);
  if (!user) return null;

  const role = normalizeRole(user.role, user.admin);
  return {
    id,
    employeeId: id,
    name: user.name || '',
    dept: user.dept || '',
    role,
    roleLevel: ROLE_LEVELS[role] || 0,
    admin: String(user.admin || '').trim() === '1',
    permissions: ROLE_PERMISSIONS[role] || []
  };
}

function hasPermission(ss, data, permission) {
  const ctx = getUserPermissionContext(ss, data);
  if (!ctx) return false;
  return ctx.permissions.indexOf(permission) >= 0;
}

function hasRoleLevel(ss, data, minRole) {
  const ctx = getUserPermissionContext(ss, data);
  if (!ctx) return false;
  const min = ROLE_LEVELS[normalizeRole(minRole, '')] || 0;
  return ctx.roleLevel >= min;
}

function isAdminRequest(ss, data) {
  return hasPermission(ss, data, PERMISSION_VIEW_ADMIN);
}

function isSystemAdminRequest(ss, data) {
  return hasPermission(ss, data, PERMISSION_VIEW_SYSTEM);
}

function canViewDepartment(ss, data, targetDept) {
  const ctx = getUserPermissionContext(ss, data);
  if (!ctx) return false;
  if (hasPermission(ss, data, PERMISSION_VIEW_ADMIN)) return true;
  if (!hasPermission(ss, data, PERMISSION_VIEW_DEPT)) return false;
  return String(ctx.dept || '') === String(targetDept || '');
}
