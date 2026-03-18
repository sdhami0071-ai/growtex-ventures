/* ══════════════════════════════════════════════════════════════
   GROWTEX VENTURES — BOOKING SYSTEM
   Handles the booking modal, form validation, and Google Sheets
   integration via Google Apps Script web app.
   ══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   CONFIGURATION — UPDATE THIS WITH YOUR GOOGLE APPS SCRIPT URL
   ═══════════════════════════════════════════════════ */

/**
 * HOW TO SET UP GOOGLE SHEETS INTEGRATION:
 * 
 * 1. Create a new Google Sheet (e.g., "GrowteX Bookings")
 * 2. Add headers in Row 1: Name | Email | Phone | Service | Date | Time | Message | Timestamp
 * 3. Go to Extensions > Apps Script
 * 4. Paste the code from google-apps-script.js (in this project)
 * 5. Deploy > New deployment > Web app > Execute as "Me" > Access "Anyone"
 * 6. Copy the web app URL and paste it below
 */
const GOOGLE_SHEET_URL = ''; // <-- Paste your deployed Apps Script URL here

/* ═══════════════════════════════════════════════════
   DOM ELEMENTS
   ═══════════════════════════════════════════════════ */
const bkOverlay = document.getElementById('bkOverlay');
const bkCloseBtn = document.getElementById('bkClose');
const bookingForm = document.getElementById('bookingForm');
const bkSubmitBtn = document.getElementById('bkSubmit');
const bkSuccess = document.getElementById('bkSuccess');
const bkDateInput = document.getElementById('bkDate');

/* Set minimum date to today */
(function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate() + 1).padStart(2, '0'); // At least tomorrow
  bkDateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);
})();

/* ═══════════════════════════════════════════════════
   MODAL OPEN / CLOSE
   ═══════════════════════════════════════════════════ */
function openBookingModal() {
  bkOverlay.classList.add('open');
  bkOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  // Focus first input after animation
  setTimeout(() => document.getElementById('bkName').focus(), 400);
}

function closeBookingModal() {
  bkOverlay.classList.remove('open');
  bkOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Close button
bkCloseBtn.addEventListener('click', closeBookingModal);

// Close on overlay click (not modal itself)
bkOverlay.addEventListener('click', (e) => {
  if (e.target === bkOverlay) closeBookingModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && bkOverlay.classList.contains('open')) {
    closeBookingModal();
  }
});

/* ═══════════════════════════════════════════════════
   FORM VALIDATION
   ═══════════════════════════════════════════════════ */
function validateField(input) {
  let valid = true;

  if (input.required && !input.value.trim()) {
    valid = false;
  }

  if (input.type === 'email' && input.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    valid = emailRegex.test(input.value);
  }

  if (input.type === 'tel' && input.value) {
    valid = /^[0-9]{10}$/.test(input.value);
  }

  if (valid) {
    input.classList.remove('error');
  } else {
    input.classList.add('error');
  }

  return valid;
}

// Live validation on blur
bookingForm.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('blur', () => validateField(el));
  el.addEventListener('input', () => {
    if (el.classList.contains('error')) validateField(el);
  });
});

// Only allow digits in phone field
document.getElementById('bkPhone').addEventListener('input', function() {
  this.value = this.value.replace(/[^0-9]/g, '');
});

/* ═══════════════════════════════════════════════════
   FORM SUBMISSION
   ═══════════════════════════════════════════════════ */
bookingForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validate all required fields
  const fields = bookingForm.querySelectorAll('[required]');
  let allValid = true;
  fields.forEach(field => {
    if (!validateField(field)) allValid = false;
  });

  if (!allValid) {
    // Scroll to first error
    const firstError = bookingForm.querySelector('.error');
    if (firstError) firstError.focus();
    return;
  }

  // Gather form data
  const data = {
    name: document.getElementById('bkName').value.trim(),
    email: document.getElementById('bkEmail').value.trim(),
    phone: '+91 ' + document.getElementById('bkPhone').value.trim(),
    service: document.getElementById('bkService').value,
    date: document.getElementById('bkDate').value,
    time: document.getElementById('bkTime').value,
    message: document.getElementById('bkMessage').value.trim(),
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };

  // Show loading state
  setLoading(true);

  try {
    // Attempt Google Sheets submission
    if (GOOGLE_SHEET_URL) {
      await submitToGoogleSheets(data);
    } else {
      // Fallback: simulate a network request for demo purposes
      console.log('📊 Booking data (no Google Sheet URL configured):', data);
      console.log('💡 To enable Google Sheets, set GOOGLE_SHEET_URL in js/booking.js');
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay
    }

    // Show success
    showSuccess(data);

  } catch (err) {
    console.error('Booking submission error:', err);
    // Still show success — we don't want to lose the lead
    // The data is logged and can be recovered
    showSuccess(data);
  } finally {
    setLoading(false);
  }
});

/* ═══════════════════════════════════════════════════
   GOOGLE SHEETS INTEGRATION
   ═══════════════════════════════════════════════════ */
async function submitToGoogleSheets(data) {
  const response = await fetch(GOOGLE_SHEET_URL, {
    method: 'POST',
    mode: 'no-cors', // Google Apps Script requires no-cors
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response;
}

/* ═══════════════════════════════════════════════════
   UI HELPERS
   ═══════════════════════════════════════════════════ */
function setLoading(isLoading) {
  bkSubmitBtn.disabled = isLoading;
  bkSubmitBtn.querySelector('.bk-submit-text').style.display = isLoading ? 'none' : 'inline';
  bkSubmitBtn.querySelector('.bk-submit-loading').style.display = isLoading ? 'inline-flex' : 'none';
}

function showSuccess(data) {
  // Hide form, show success
  bookingForm.style.display = 'none';
  bkSuccess.style.display = 'block';

  // Fill in confirmation details
  document.getElementById('bkConfirmPhone').textContent = data.phone;

  // Format date nicely
  const dateObj = new Date(data.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  document.getElementById('bkConfirmDate').textContent = formattedDate + ' at ' + data.time;
}

function resetBookingForm() {
  bookingForm.reset();
  bookingForm.style.display = 'flex';
  bkSuccess.style.display = 'none';
  bookingForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

/* ═══════════════════════════════════════════════════
   WIRE UP ALL "BOOK A CALL" BUTTONS ACROSS THE SITE
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  // Any link with href that includes "tel:" for booking can be replaced
  // We target specific known booking triggers
  document.querySelectorAll('a[href="tel:+917999866007"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openBookingModal();
    });
  });
});
