/**
 * GROWTEX VENTURES - GOOGLE APPS SCRIPT v11 (Manual Auth Trigger)
 */

const CONFIG = {
  SHEET_ID: '1t5miC3kRW56chGpzXt_cEeSka6vQJ4Zp617dVajI9Us', 
  SHEET_NAME: 'calender booking for growtex.in' 
};

// 🖱️ RUN THIS FUNCTION ONCE TO TRIGGER THE "AUTHORIZE ACCESS" POP-UP!
function testAuth() {
  var cal = CalendarApp.getDefaultCalendar();
  console.log("Success! You have granted permission to use: " + cal.getName());
  MailApp.sendEmail({to: Session.getActiveUser().getEmail(), subject: "Auth Check", body: "Auth is active!"});
}

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var meetLink = "Generating...";
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];

    // 1. Capture Data
    var name      = e.parameter.name || 'Client';
    var email     = e.parameter.email || '';
    var phone     = e.parameter.phone || '';
    var service   = e.parameter.service || 'Inquiry';
    var dateStr   = e.parameter.date || ''; 
    var timeStr   = e.parameter.time || ''; 
    var message   = e.parameter.message || '';
    var slotKey   = e.parameter.slotKey || '';
    var timestamp = new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata"});

    if (!email) return response({"result": "error", "error": "No email provided"});

    // 2. Calendar & Meet Automation
    try {
      var startIso = dateStr + "T" + timeStr + ":00+05:30";
      var startTime = new Date(startIso);
      var endTime = new Date(startTime.getTime() + (30 * 60 * 1000));

      var event = {
        summary: 'GrowteX Discovery Call: ' + name,
        location: 'Google Meet',
        description: 'Service: ' + service + '\nPhone: ' + phone,
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

      // CRITICAL: Requires Google Calendar API enabled in 'Services'
      var createdEvent = Calendar.Events.insert(event, 'primary', { conferenceDataVersion: 1 });
      
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        meetLink = createdEvent.conferenceData.entryPoints[0].uri;
      }
      
      // 3. Send Email
      var emailBody = "Hi " + name + ",\n\n" +
                      "Your GrowteX Discovery Call is confirmed!\n" +
                      "📅 Date: " + dateStr + "\n" +
                      "⏰ Time: " + timeStr + " IST\n" +
                      "🔗 Meet Link: " + meetLink + "\n\n" +
                      "See you there!\n - GrowteX Team";
                      
      MailApp.sendEmail({to: email, subject: "Booking Confirmed: GrowteX", body: emailBody, name: "GrowteX Ventures"});

    } catch (calErr) {
      meetLink = "Auth Error: " + calErr.message;
    }

    // 4. Save to Sheet
    sheet.appendRow([name, email, phone, service, dateStr, timeStr, message, timestamp, slotKey, meetLink, 'confirmed']);
    return response({"result": "success", "meetLink": meetLink});

  } catch(err) {
    return response({"result": "error", "error": err.toString()});
  }
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
