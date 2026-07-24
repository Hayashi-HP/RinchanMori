/* RinchanMori Apps Script config */

const SHEET_USERS = 'users';
const SHEET_ACTIVITIES = 'activities';
const SHEET_THANKS = 'thanks';
const SHEET_LOGS = 'logs';
const SHEET_ERROR_LOGS = 'error_logs';
const SHEET_AUDIT_LOGS = 'audit_logs';
const SHEET_BACKUP_LOGS = 'backup_logs';
const SHEET_DEPARTMENTS = 'departments';
const SHEET_USER_READS = 'user_reads';
const SHEET_NOTICES = 'notices';
const SHEET_CHALLENGES = 'challenges';
const SHEET_BADGES = 'badges';
const SHEET_EVENTS = 'events';
const SHEET_APP_SETTINGS = 'app_settings';
const SHEET_POINT_TRANSACTIONS = 'point_transactions';
const VERSION = 'v1.6.0';

const DEFAULT_APP_SETTINGS = {
  defaultWeeklyStepGoal: 56000,
  inactivityAlertDays: 7,
  commonDailyStepGoalEnabled: false,
  commonDailyStepGoal: 8000,
  preferPersonalDailyStepGoal: true,
  commonDailyStepGoalOnlyWhenUnset: true
};

const DEFAULT_DEPARTMENTS = [
  ['doctor', '医局', 10, true, 'doctor'],
  ['nurse', '看護部', 20, true, 'nurse'],
  ['medicaltech', '医療技術部', 30, true, 'medicaltech'],
  ['renkei', '地域医療連携室', 40, true, 'renkei'],
  ['office', '事務部', 50, true, 'office'],
  ['grouphome', 'グループホーム', 60, true, 'grouphome'],
  ['caresupport', 'ケアサポ', 70, true, 'caresupport'],
  ['other', 'その他', 80, true, 'other']
];
