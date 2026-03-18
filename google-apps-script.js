/**
 * ══════════════════════════════════════════════════════════════
 * GROWTEX VENTURES — GOOGLE APPS SCRIPT (for Google Sheets)
 * ══════════════════════════════════════════════════════════════
 * 
 * ⚠️  UPDATED VERSION — You MUST re-deploy this in Apps Script!
 * 
 * STEPS TO UPDATE:
 * 1. Go to your Apps Script project (script.google.com)
 * 2. Delete ALL existing code in Code.gs
 * 3. Paste ONLY the code between the "PASTE FROM HERE" markers below
 * 4. Deploy → Manage deployments → Edit (pencil icon) → New version → Deploy
 *    (Do NOT create a new deployment — update the existing one)
 * 
 * ══════════════════════════════════════════════════════════════
 */

// ─── PASTE FROM HERE INTO GOOGLE APPS SCRIPT ───

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Read form-encoded data (from URLSearchParams)
    var name = e.parameter.name || '';
    var email = e.parameter.email || '';
    var phone = e.parameter.phone || '';
    var service = e.parameter.service || '';
    var date = e.parameter.date || '';
    var time = e.parameter.time || '';
    var message = e.parameter.message || '';
    var timestamp = e.parameter.timestamp || new Date().toLocaleString();
    
    sheet.appendRow([name, email, phone, service, date, time, message, timestamp]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 'status': 'GrowteX Booking API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── STOP PASTING HERE ───
