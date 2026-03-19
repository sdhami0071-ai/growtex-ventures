/**
 * GROWTEX VENTURES - GOOGLE APPS SCRIPT v9 (Pro Gmail + Meet Automation)
 * 
 * 🚀 WHAT THIS DOES:
 * 1. Saves booking to: calender booking for growtex.in
 * 2. Creates a Google Calendar Event + Auto Google Meet Link.
 * 3. Sends a Personalized Gmail from s.dhami0071@gmail.com to the customer.
 */

const CONFIG = {
  SHEET_ID: '1t5miC3kRW56chGpzXt_cEeSka6vQJ4Zp617dVajI9Us', 
  SHEET_NAME: 'calender booking for growtex.in',
  SENDER_NAME: 'GrowteX Ventures',
  SENDER_EMAIL: 's.dhami0071@gmail.com' // Ensure you deploy this script using this account!
};

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];

    // 1. Capture Data
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

    // 2. Calendar Event + Meet Link
    var meetLink = "Generating...";
    try {
      var startTime = new Date(dateStr + "T" + timeStr + ":00+05:30");
      var endTime = new Date(startTime.getTime() + (30 * 60 * 1000));

      var event = {
        summary: 'GrowteX Discovery Call: ' + name,
        location: 'Google Meet',
        description: 'Service: ' + service + '\nClient: ' + name + '\nPhone: ' + phone,
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

      // Create Calendar Event (Sends Invite)
      var createdEvent = Calendar.Events.insert(event, 'primary', { conferenceDataVersion: 1 });
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        meetLink = createdEvent.conferenceData.entryPoints[0].uri;
      }

      // 3. Send Personalized Gmail Confirmation
      var emailBody = "Hi " + name + ",\n\n" +
                      "Your GrowteX Discovery Call has been confirmed! 🚀\n\n" +
                      "📅 Date: " + dateStr + "\n" +
                      "⏰ Time: " + timeStr + " IST\n" +
                      "🔗 Meeting Link: " + meetLink + "\n\n" +
                      "An invite has also been added to your Google Calendar. We look forward to talking to you!\n\n" +
                      "Best regards,\n" +
                      "The GrowteX Team\n" +
                      "www.growtex.in";

      MailApp.sendEmail({
        to: email,
        subject: "Booking Confirmed: Discovery Call with GrowteX",
        body: emailBody,
        name: CONFIG.SENDER_NAME
      });

    } catch (e) {
      console.error(e);
      meetLink = "Manual Invitation Required";
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
