/*
 * RinchanMori Apps Script
 * Version: v0.9.64
 *
 * Code.gs is intentionally kept small.
 * API branching lives in Router.gs.
 */

function doGet(e) {
  try {
    const action = e && e.parameter ? String(e.parameter.action || '') : '';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const setup = setupProject(ss);
    return handleGet(action, e, ss, setup);
  } catch (err) {
    return jsonOutput({ ok: false, error: err.message, version: VERSION });
  }
}

function doPost(e) {
  try {
    const data = parseRequest(e);
    const action = String(data.action || '').trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupProject(ss);
    return handlePost(action, data, ss);
  } catch (err) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      setupProject(ss);
      writeLog(ss, 'error', '', '', 'ng', err.message);
    } catch (ignore) {}
    return jsonOutput({ ok: false, error: err.message, version: VERSION });
  }
}

function setupProjectManual() {
  return setupProject(SpreadsheetApp.getActiveSpreadsheet());
}
