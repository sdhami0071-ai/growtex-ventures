/**
 * ══════════════════════════════════════════════════════════════
 * GROWTEX VENTURES — GOOGLE APPS SCRIPT v3
 * ══════════════════════════════════════════════════════════════
 * 
 * ⚠️  UPDATED AGAIN — You MUST re-deploy this in Apps Script!
 * 
 * STEPS TO UPDATE:
 * 1. Go to script.google.com → your project
 * 2. Delete ALL existing code in Code.gs
 * 3. Paste ONLY the code between the "PASTE" markers below
 * 4. Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy
 * 
 * ══════════════════════════════════════════════════════════════
 */

// ─── PASTE FROM HERE INTO GOOGLE APPS SCRIPT ───

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    var name = e.parameter.name || '';
    var email = e.parameter.email || '';
    var phone = e.parameter.phone || '';
    var service = e.parameter.service || '';
    var date = e.parameter.date || '';
    var time = e.parameter.time || '';
    var message = e.parameter.message || '';
    var timestamp = e.parameter.timestamp || new Date().toLocaleString();
    
    if (name || email || phone) {
      sheet.appendRow([name, email, phone, service, date, time, message, timestamp]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    var name = e.parameter.name || '';
    var email = e.parameter.email || '';
    var phone = e.parameter.phone || '';
    var service = e.parameter.service || '';
    var date = e.parameter.date || '';
    var time = e.parameter.time || '';
    var message = e.parameter.message || '';
    var timestamp = e.parameter.timestamp || new Date().toLocaleString();
    
    if (name || email || phone) {
      sheet.appendRow([name, email, phone, service, date, time, message, timestamp]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── STOP PASTING HERE ───
