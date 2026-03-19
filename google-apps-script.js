/**
 * GROWTEX VENTURES - GOOGLE APPS SCRIPT v7 (Ultimate Automation)
 * 
 * 🚀 WHAT THIS DOES:
 * 1. Saves student/client bookings to Google Sheets.
 * 2. Creates a Google Calendar event.
 * 3. Generates a unique Google Meet info.
 * 4. Invites the user automatically.
 *
 * 🛠️ CONFIGURATION (IMPORTANT):
 * Update the 'SHEET_ID' if you are using a Standalone Apps Script.
 * Your Sheet ID is in the URL: docs.google.com/spreadsheets/d/ [THIS_PART] /edit
 */

const CONFIG = {
  SHEET_ID: '', // Optional: Fill this if your script isn't saving (e.g. '1abc123...')
  SHEET_NAME: 'Sheet1' // Your tab name
};

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    // 1. Open Sheet
    var ss = CONFIG.SHEET_ID ? SpreadsheetApp.openById(CONFIG.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];

    // 2. Extract Data
    var name      = e.parameter.name || 'Client';
    var email     = e.parameter.email || '';
    var phone     = e.parameter.phone || '';
    var service   = e.parameter.service || 'Inquiry';
    var dateStr   = e.parameter.date || ''; // YYYY-MM-DD
    var timeStr   = e.parameter.time || ''; // HH:MM
    var message   = e.parameter.message || '';
    var slotKey   = e.parameter.slotKey || '';
    var timestamp = new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata"});

    if (!email) return response({"result": "error", "error": "No email provided"});

    // 3. Duplicate check
    if (slotKey) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][8] === slotKey) return response({"result": "error", "error": "Already booked"});
      }
    }

    // 4. Calendar & Meet link
    var meetLink = "Generating...";
    try {
      var startIso = dateStr + "T" + timeStr + ":00+05:30";
      var startTime = new Date(startIso);
      var endTime = new Date(startTime.getTime() + (30 * 60 * 1000));

      var event = {
        summary: 'GrowteX Discovery Call: ' + name,
        location: 'Google Meet',
        description: 'Service: ' + service + '\nPhone: ' + phone + '\nMessage: ' + message,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: [{ email: email }],
        conferenceData: {
          createRequest: {
            requestId: "gtx_" + Date.now(),
            conferenceSolutionKey: { type: "hangoutsMeet" }
          }
        }
      };

      var createdEvent = Calendar.Events.insert(event, 'primary', { conferenceDataVersion: 1 });
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        meetLink = createdEvent.conferenceData.entryPoints[0].uri;
      }
    } catch (e) {
      console.error(e);
      meetLink = "Manual Invite Needed";
    }

    // 5. Save Row
    sheet.appendRow([name, email, phone, service, dateStr, timeStr, message, timestamp, slotKey, meetLink, 'confirmed']);

    return response({"result": "success", "meetLink": meetLink});

  } catch(err) {
    return response({"result": "error", "error": err.toString()});
  }
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
