/**
 * GROWTEX VENTURES - GOOGLE APPS SCRIPT v6 (Pro Automation)
 * 
 * 🚀 WHAT THIS DOES:
 * 1. Saves every booking to your Google Sheet.
 * 2. Automatically sends a Google Calendar invite to the customer's email.
 * 3. Generates a unique Google Meet link and includes it in the invitation.
 * 4. Saves that specific Meet Link into the Google Sheet for your records.
 *
 * 📋 SHEET HEADERS (Row 1):
 * Name | Email | Phone | Service | Date | Time | Message | Timestamp | SlotKey | Meet Link | Status
 *
 * 🛠️ SETUP INSTRUCTIONS (MANDATORY):
 * 1. Extensions > Apps Script.
 * 2. Paste this code.
 * 3. On the left sidebar, click '+' next to 'Services'.
 * 4. Find and add "Google Calendar API".
 * 5. Deployment > New Deployment > Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 */

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Use first sheet

    // 1. Get parameters from URL
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

    // 2. Duplicate Check
    if (slotKey) {
      var vals = sheet.getDataRange().getValues();
      for (var i = 1; i < vals.length; i++) {
        if (vals[i][8] === slotKey) {
          return response({"result": "error", "error": "Slot already booked"});
        }
      }
    }

    // 3. Calendar & Meet Automation
    var meetLink = "Generating...";
    try {
      // Parse timing for IST (+05:30)
      var startIso = dateStr + "T" + timeStr + ":00+05:30";
      var startTime = new Date(startIso);
      var endTime = new Date(startTime.getTime() + (30 * 60 * 1000)); // 30 min duration

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

      // Create event with Meet link
      var calEvent = Calendar.Events.insert(eventResource, 'primary', { conferenceDataVersion: 1 });
      
      if (calEvent.conferenceData && calEvent.conferenceData.entryPoints) {
        meetLink = calEvent.conferenceData.entryPoints[0].uri;
      }
    } catch (err) {
      console.error("Calendar Error: " + err.message);
      meetLink = "Manual Invite Needed";
    }

    // 4. Save to Sheet
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
