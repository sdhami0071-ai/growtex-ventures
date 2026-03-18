/**
 * ══════════════════════════════════════════════════════════════
 * GROWTEX VENTURES — GOOGLE APPS SCRIPT (for Google Sheets)
 * ══════════════════════════════════════════════════════════════
 * 
 * SETUP INSTRUCTIONS:
 * ────────────────────
 * 1. Open Google Sheets → Create a new spreadsheet
 *    Name it: "GrowteX Bookings"
 * 
 * 2. In Row 1 (headers), add these columns:
 *    A: Name | B: Email | C: Phone | D: Service | E: Date | F: Time | G: Message | H: Timestamp
 * 
 * 3. Go to Extensions → Apps Script
 * 
 * 4. Delete all existing code and paste EVERYTHING below this comment block
 * 
 * 5. Click Deploy → New Deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy
 * 
 * 6. Copy the Web App URL (looks like: https://script.google.com/macros/s/AKfyc.../exec)
 * 
 * 7. Paste that URL into js/booking.js where it says:
 *    const GOOGLE_SHEET_URL = '';  ←  paste here
 * 
 * 8. Done! All bookings will now automatically appear in your Google Sheet.
 * ══════════════════════════════════════════════════════════════
 */

// ─── PASTE FROM HERE INTO GOOGLE APPS SCRIPT ───

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.name,
      data.email,
      data.phone,
      data.service,
      data.date,
      data.time,
      data.message || '',
      data.timestamp
    ]);
    
    // Optional: Send email notification
    try {
      MailApp.sendEmail({
        to: 'your-email@growtex.in', // Change to your email
        subject: '🔔 New GrowteX Booking: ' + data.name,
        htmlBody: 
          '<h2>New Booking Received!</h2>' +
          '<table style="border-collapse:collapse;">' +
          '<tr><td style="padding:8px;font-weight:bold;">Name:</td><td style="padding:8px;">' + data.name + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;">' + data.email + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;">Phone:</td><td style="padding:8px;">' + data.phone + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;">Service:</td><td style="padding:8px;">' + data.service + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;">Date:</td><td style="padding:8px;">' + data.date + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;">Time:</td><td style="padding:8px;">' + data.time + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;">Message:</td><td style="padding:8px;">' + (data.message || 'N/A') + '</td></tr>' +
          '</table>'
      });
    } catch(mailErr) {
      // Email sending is optional - don't fail the request
      Logger.log('Email notification failed: ' + mailErr);
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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 'status': 'GrowteX Booking API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── STOP PASTING HERE ───
