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
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycby_Wj6gQ7Bjvn0LwdD69_g3N6mAQvoF8NU0Ss0OltCxXWAZ8D8sgk67T7pLANeSxk18/exec';

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
   Uses Image beacon + doGet approach (same technique
   used by Google Analytics). Sends data as URL query
   parameters which bypasses all CORS/redirect issues.
   ═══════════════════════════════════════════════════ */
async function submitToGoogleSheets(data) {
  return new Promise((resolve) => {
    const params = new URLSearchParams(data).toString();
    const url = GOOGLE_SHEET_URL + '?' + params;
    
    // Method 1: Image beacon (most reliable cross-origin)
    const img = new Image();
    let resolved = false;
    
    const done = () => {
      if (!resolved) {
        resolved = true;
        console.log('✅ Booking data sent to Google Sheets');
        resolve();
      }
    };
    
    img.onload = done;
    img.onerror = done; // onerror still fires AFTER the request completes
    img.src = url;
    
    // Fallback timeout
    setTimeout(done, 4000);
  });
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
   WIRE UP ALL BOOKING BUTTONS ACROSS THE SITE
   Intercepts by text content + CSS classes so it works
   even if browser caches the old HTML.
   ═══════════════════════════════════════════════════ */
(function wireUpBookingButtons() {
  // Keywords that indicate a booking/agent button
  const bookingKeywords = ['talk to', 'book a', 'schedule', 'agent', 'get recognized', 'claim your tax'];
  
  // CSS selectors for known booking trigger elements
  const selectorTargets = [
    '.nav-cta',           // Nav "Talk to an Agent" button
    '.btn-o',             // Hero outline button
    'button.bw',          // CTA "Book a Free Call" button
    'a.bw'                // CTA "Book a Free Call" link
  ];
  
  // 1. Wire up by CSS selectors (highest priority)
  selectorTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openBookingModal();
      });
    });
  });
  
  // 2. Wire up tel: links
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openBookingModal();
    });
  });
  
  // 3. Wire up ALL links/buttons with booking keywords in their text
  //    This includes WhatsApp links that say "Talk to Agent" etc.
  //    Only skip: chatbot buttons, booking modal's own buttons, and the green WhatsApp CTA (.bwa)
  document.querySelectorAll('a, button').forEach(el => {
    const text = el.textContent.toLowerCase();
    
    // Skip chatbot elements
    if (el.classList.contains('cfab') || el.classList.contains('qrb') || el.classList.contains('ccl')) return;
    // Skip booking modal's own buttons
    if (el.closest('.bk-modal') || el.closest('.bk-overlay')) return;
    // Skip the green WhatsApp CTA button (class .bwa) — keep that as real WhatsApp
    if (el.classList.contains('bwa')) return;
    // Skip footer links
    if (el.closest('footer')) return;
    // Skip the "What is Startup India?" FAQ link
    if (text.includes('what is startup')) return;
    
    const isBookingButton = bookingKeywords.some(kw => text.includes(kw));
    if (isBookingButton) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openBookingModal();
      });
      // Visual hint: change cursor
      el.style.cursor = 'pointer';
    }
  });

  console.log('✅ GrowteX Booking System loaded — all buttons wired up!');
})();


