/*
 * GROWTEX VENTURES - GOOGLE APPS SCRIPT v4
 *
 * PASTE ALL OF THIS CODE INTO Code.gs
 *
 * SHEET HEADERS (Row 1):
 * Name | Email | Phone | Service | Date | Time | Message | Timestamp | SlotKey | Status
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    var name      = e.parameter.name || '';
    var email     = e.parameter.email || '';
    var phone     = e.parameter.phone || '';
    var service   = e.parameter.service || '';
    var date      = e.parameter.date || '';
    var time      = e.parameter.time || '';
    var message   = e.parameter.message || '';
    var timestamp = e.parameter.timestamp || new Date().toLocaleString();
    var slotKey   = e.parameter.slotKey || '';
    var status    = e.parameter.status || 'pending';

    if (!name && !email && !phone) {
      return ContentService
        .createTextOutput(JSON.stringify({"result": "error", "error": "No data provided"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Check for duplicate slot booking
    if (slotKey) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][8] === slotKey) {
          return ContentService
            .createTextOutput(JSON.stringify({"result": "error", "error": "Slot already booked", "slotKey": slotKey}))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    sheet.appendRow([name, email, phone, service, date, time, message, timestamp, slotKey, status]);

    return ContentService
      .createTextOutput(JSON.stringify({"result": "success", "row": sheet.getLastRow()}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({"result": "error", "error": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
