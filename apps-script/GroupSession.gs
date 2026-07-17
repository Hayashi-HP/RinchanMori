/* GroupSession connection test helpers */

const GROUP_SESSION_WHOAMI_PATH = '/api/user/whoami.do';

function getGroupSessionConfig() {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = String(props.getProperty('GS_BASE_URL') || '').trim();
  const apiUser = String(props.getProperty('GS_API_USER') || '').trim();
  const apiPassword = String(props.getProperty('GS_API_PASSWORD') || '').trim();
  const missing = [];
  if (!baseUrl) missing.push('GS_BASE_URL');
  if (!apiUser) missing.push('GS_API_USER');
  if (!apiPassword) missing.push('GS_API_PASSWORD');
  return { baseUrl, apiUser, apiPassword, missing };
}

function normalizeGroupSessionBaseUrl(baseUrl) {
  const text = String(baseUrl || '').trim();
  if (!text) return '';
  return text.replace(/\/+$/, '') + '/';
}

function getGroupSessionOrigin(baseUrl) {
  const normalized = normalizeGroupSessionBaseUrl(baseUrl);
  const match = normalized.match(/^(https?:\/\/[^/]+)\//i);
  return match ? match[1] : normalized.replace(/\/+$/, '');
}

function buildGroupSessionAuthHeader(apiUser, apiPassword) {
  const token = Utilities.base64Encode(Utilities.newBlob(String(apiUser || '') + ':' + String(apiPassword || '')).getBytes());
  return 'Basic ' + token;
}

function resolveGroupSessionUrl(baseUrl, currentUrl, location) {
  const origin = getGroupSessionOrigin(baseUrl);
  const target = String(location || '').trim();
  if (!target) return String(currentUrl || '').trim();
  if (/^https?:\/\//i.test(target)) return target;
  if (target.charAt(0) === '/') return origin + target;
  const current = String(currentUrl || '').trim();
  const base = current.replace(/[^/]*$/, '');
  return base + target;
}

function fetchGroupSessionWhoami(config) {
  const baseUrl = normalizeGroupSessionBaseUrl(config.baseUrl);
  if (!baseUrl) throw new Error('gs_config_missing');

  const authHeader = buildGroupSessionAuthHeader(config.apiUser, config.apiPassword);
  const headers = {
    Authorization: authHeader,
    Accept: 'application/xml,text/xml,*/*;q=0.8'
  };
  let currentUrl = baseUrl + GROUP_SESSION_WHOAMI_PATH.replace(/^\/+/, '');
  let response = null;
  let redirectCount = 0;

  while (redirectCount < 2) {
    response = UrlFetchApp.fetch(currentUrl, {
      method: 'get',
      headers,
      muteHttpExceptions: true,
      followRedirects: false,
      validateHttpsCertificates: true
    });

    const status = response.getResponseCode();
    if (status < 300 || status >= 400) break;

    const responseHeaders = response.getAllHeaders ? response.getAllHeaders() : {};
    const location = responseHeaders.Location || responseHeaders.location || '';
    if (!location) break;
    currentUrl = resolveGroupSessionUrl(baseUrl, currentUrl, location);
    redirectCount += 1;
  }

  return {
    httpStatus: response ? response.getResponseCode() : 0,
    headers: response && response.getAllHeaders ? response.getAllHeaders() : {},
    text: response ? response.getContentText('UTF-8') : '',
    finalUrl: currentUrl
  };
}

function parseGroupSessionXml(xmlText) {
  const text = String(xmlText || '').trim();
  if (!text) throw new Error('gs_invalid_xml');
  return XmlService.parse(text);
}

function normalizeXmlFieldName(name) {
  return String(name || '').trim().toLowerCase();
}

function collectGroupSessionXmlFields(element, map) {
  if (!element) return map;
  const fieldName = normalizeXmlFieldName(element.getName());
  const fieldValue = String(element.getText() || '').trim();
  if (fieldName && fieldValue && !Object.prototype.hasOwnProperty.call(map, fieldName)) {
    map[fieldName] = fieldValue;
  }
  const children = element.getChildren();
  for (let i = 0; i < children.length; i += 1) {
    collectGroupSessionXmlFields(children[i], map);
  }
  return map;
}

function pickGroupSessionField(fields, candidates) {
  for (let i = 0; i < candidates.length; i += 1) {
    const key = normalizeXmlFieldName(candidates[i]);
    if (fields[key]) return fields[key];
  }
  return '';
}

function testGroupSessionConnection(ss, data) {
  const config = getGroupSessionConfig();
  const apiPath = GROUP_SESSION_WHOAMI_PATH;

  if (config.missing.length) {
    return {
      ok: false,
      action: 'adminGroupSessionConnectionTest',
      errorCode: 'gs_config_missing',
      reason: 'gs_config_missing',
      message: 'GroupSession接続設定が不足しています。管理者に確認してください。',
      httpStatus: 0,
      apiPath,
      connected: false,
      authenticated: false,
      requiredFieldsAvailable: false,
      missingFields: []
    };
  }

  let response = null;
  try {
    response = fetchGroupSessionWhoami(config);
  } catch (e) {
    const reason = String(e && e.message ? e.message : 'gs_connection_failed');
    return {
      ok: false,
      action: 'adminGroupSessionConnectionTest',
      errorCode: reason === 'gs_config_missing' ? 'gs_config_missing' : 'gs_connection_failed',
      reason: reason === 'gs_config_missing' ? 'gs_config_missing' : 'gs_connection_failed',
      message: 'GroupSessionへ接続できませんでした。設定と接続先を確認してください。',
      httpStatus: 0,
      apiPath,
      connected: false,
      authenticated: false,
      requiredFieldsAvailable: false,
      missingFields: []
    };
  }

  const httpStatus = Number(response.httpStatus || 0);
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      ok: false,
      action: 'adminGroupSessionConnectionTest',
      errorCode: 'gs_auth_failed',
      reason: 'gs_auth_failed',
      message: 'GroupSessionの認証に失敗しました。認証情報を確認してください。',
      httpStatus,
      apiPath,
      connected: true,
      authenticated: false,
      requiredFieldsAvailable: false,
      missingFields: []
    };
  }

  if (httpStatus >= 400) {
    return {
      ok: false,
      action: 'adminGroupSessionConnectionTest',
      errorCode: 'gs_http_error',
      reason: 'gs_http_error',
      message: 'GroupSessionの応答にエラーがありました。接続先の状態を確認してください。',
      httpStatus,
      apiPath,
      connected: true,
      authenticated: false,
      requiredFieldsAvailable: false,
      missingFields: []
    };
  }

  let document;
  try {
    document = parseGroupSessionXml(response.text);
  } catch (e) {
    return {
      ok: false,
      action: 'adminGroupSessionConnectionTest',
      errorCode: 'gs_invalid_xml',
      reason: 'gs_invalid_xml',
      message: 'GroupSessionのXML応答を解析できませんでした。',
      httpStatus,
      apiPath,
      connected: true,
      authenticated: true,
      requiredFieldsAvailable: false,
      missingFields: []
    };
  }

  const fields = collectGroupSessionXmlFields(document.getRootElement(), {});
  const requiredFields = {
    userSid: ['usrsid', 'usersid', 'sid'],
    loginId: ['loginid', 'usrid', 'userid'],
    employeeId: ['employeeid', 'staffno', 'staffnumber', 'usrno', 'empno', 'loginid'],
    name: ['name', 'usrname', 'username'],
    affiliation: ['affiliation', 'belong', 'belongname', 'groupname', 'deptname', 'usrgroupname', 'usrbelong'],
    birthdate: ['birthday', 'birthdate', 'birth_date', 'usrbirthday', 'dob'],
    birthdayPublicFlag: ['birthdaykf', 'birthdatepublicflag', 'birthpublicflag', 'usrbirthdaykf', 'usrbirthkf'],
    status: ['usrukoflg', 'active', 'status', 'userstatus', 'enabledflg']
  };

  const presentFields = {};
  const missingFields = [];
  Object.keys(requiredFields).forEach(key => {
    const value = pickGroupSessionField(fields, requiredFields[key]);
    if (value) presentFields[key] = true;
    else missingFields.push(key);
  });

  const requiredFieldsAvailable = missingFields.length === 0;

  if (!requiredFieldsAvailable) {
    return {
      ok: false,
      action: 'adminGroupSessionConnectionTest',
      errorCode: 'gs_required_fields_missing',
      reason: 'gs_required_fields_missing',
      message: 'GroupSessionの必要項目が取得できませんでした。',
      httpStatus,
      apiPath,
      connected: true,
      authenticated: true,
      requiredFieldsAvailable: false,
      missingFields: missingFields
    };
  }

  return {
    ok: true,
    action: 'adminGroupSessionConnectionTest',
    connected: true,
    authenticated: true,
    requiredFieldsAvailable: true,
    missingFields: [],
    httpStatus,
    apiPath,
    version: VERSION
  };
}