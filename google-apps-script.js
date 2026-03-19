/**
 * GROWTEX VENTURES - GOOGLE APPS SCRIPT v8 (Customized)
 * 
 * 🚀 WHAT THIS DOES:
 * 1. Saves every booking to your specific Google Sheet (ID: 1t5miC3kRW56ch...)
 * 2. Automatically sends a Google Calendar invite to the customer's email.
 * 3. Generates a unique Google Meet link.
 * 4. Saves the Meet Link into the Sheet.
 *
 * 🛠️ CONFIGURATION (Pre-filled for you):
 */

const CONFIG = {
  SHEET_ID: '1t5miC3kRW56chGpzXt_cEeSka6vQJ4Zp617dVajI9Us', 
  SHEET_NAME: 'calender booking for growtex.in' 
};

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    // 1. Open the specific Sheet
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
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

    if (!email) {
      return response({"result": "error", "error": "No email provided"});
    }

    // 3. Duplicate Check
    if (slotKey) {
      var vals = sheet.getDataRange().getValues();
      for (var i = 1; i < vals.length; i++) {
        if (vals[i][8] === slotKey) {
          return response({"result": "error", "error": "Slot already booked"});
        }
      }
    }

    // 4. Calendar & Meet Automation
    var meetLink = "Generating...";
    try {
      var startIso = dateStr + "T" + timeStr + ":00+05:30";
      var startTime = new Date(startIso);
      var endTime = new Date(startTime.getTime() + (30 * 60 * 1000));

      var eventResource = {
        summary: 'GrowteX Discovery Call: ' + name,
        location: 'Google Meet',
        description: 'Service: ' + service + '\nPhone: ' + phone + '\nNotes: ' + message,
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

      var calEvent = Calendar.Events.insert(eventResource, 'primary', { conferenceDataVersion: 1 });
      
      if (calEvent.conferenceData && calEvent.conferenceData.entryPoints) {
        meetLink = calEvent.conferenceData.entryPoints[0].uri;
      }
    } catch (err) {
      console.error("Calendar Error: " + err.message);
      meetLink = "Manual Invite Needed";
    }

    // 5. Save to Sheet
    // Order: Name | Email | Phone | Service | Date | Time | Message | Timestamp | SlotKey | Meet Link | Status
    sheet.appendRow([
      name, 
      email, 
      phone, 
      service, 
      dateStr, 
      timeStr, 
      message, 
      timestamp, 
      slotKey, 
      meetLink, 
      'confirmed'
    ]);

    return response({"result": "success", "meetLink": meetLink});

  } catch(fErr) {
    return response({"result": "error", "error": fErr.toString()});
  }
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
