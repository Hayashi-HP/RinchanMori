/*
 * RinchanMori Apps Script
 * Version: v1.4.10
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

function testUserReadsManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupProject(ss);

  const employeeId = '2110401';
  const newsId = 'manual-test-news-' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss');
  const thanksId = 'manual-test-thanks-' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss');

  const newsState = markNewsRead(ss, {
    employeeId: employeeId,
    newsId: newsId,
    readNewsIds: [newsId]
  });

  const thanksState = markThanksRead(ss, {
    employeeId: employeeId,
    thanksId: thanksId,
    readThanksFlowerIds: [thanksId]
  });

  const result = {
    ok: true,
    version: VERSION,
    employeeId: employeeId,
    newsId: newsId,
    thanksId: thanksId,
    userReads: getUserReadState(ss, employeeId),
    newsStateHasUserReads: !!(newsState && newsState.userReads),
    thanksStateHasUserReads: !!(thanksState && thanksState.userReads)
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
