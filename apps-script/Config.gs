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
const VERSION = 'v1.0.16';

const DEFAULT_DEPARTMENTS = [
  ['nurse', '看護部', 10, true, 'nurse'],
  ['reha', 'リハビリテーション部', 20, true, 'reha'],
  ['care', '介護部', 30, true, 'care'],
  ['doctor', '医局', 40, true, 'doctor'],
  ['pharmacy', '薬剤部', 50, true, 'pharmacy'],
  ['nutrition', '栄養科', 60, true, 'nutrition'],
  ['office', '事務部', 70, true, 'office'],
  ['other', 'その他', 90, true, 'other']
];
