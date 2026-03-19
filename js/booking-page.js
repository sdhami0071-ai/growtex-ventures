/* ══════════════════════════════════════════════════════════════
   GROWTEX VENTURES — BOOKING PAGE LOGIC
   Multi-step wizard: Type → Date/Time → Details → Submit
   ══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════ */
const BOOKING_CONFIG = {
  slotDuration: 30,          // minutes
  workingHoursStart: 10,     // 10 AM
  workingHoursEnd: 19,       // 7 PM (19:00)
  timezone: 'Asia/Kolkata',
  maxBookingsPerSlot: 1,
  weekendsDisabled: true,    // No Sat/Sun
  maxAdvanceDays: 60,        // Can book up to 60 days ahead
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbztccLstBlbPmgCMwHgfZhNzoAbHXkS4xDQU4KkN3-E-634f5UAc2q-EvU7a6diH-Va/exec'
};

/* ═══════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════ */
let currentStep = 1;
let selectedType = 'demo';
let selectedDate = null;
let selectedTime = null;
let calendarDate = new Date(); // Currently displayed month

// Get booked slots from localStorage
function getBookedSlots() {
  try {
    return JSON.parse(localStorage.getItem('growtexBookedSlots') || '[]');
  } catch { return []; }
}

function addBookedSlot(slotKey) {
  const slots = getBookedSlots();
  if (!slots.includes(slotKey)) {
    slots.push(slotKey);
    localStorage.setItem('growtexBookedSlots', JSON.stringify(slots));
  }
}

// Generate slotKey: "2026-03-21_10:00_demo"
function makeSlotKey(date, time, type) {
  return `${date}_${time}_${type}`;
}

/* ═══════════════════════════════════════════════════
   URL PARAMS — preselect type from homepage buttons
   ═══════════════════════════════════════════════════ */
(function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  if (type === 'agent' || type === 'demo') {
    selectedType = type;
    document.querySelectorAll('.bp-type-card').forEach(c => c.classList.remove('active'));
    const target = type === 'agent' ? document.getElementById('typeAgent') : document.getElementById('typeDemo');
    if (target) target.classList.add('active');
    updateTypeLabel();
  }
})();

/* ═══════════════════════════════════════════════════
   STEP NAVIGATION
   ═══════════════════════════════════════════════════ */
function goToStep(step) {
  currentStep = step;
  
  // Hide all panels
  document.querySelectorAll('.bp-panel').forEach(p => p.style.display = 'none');
  
  // Show target panel
  const target = document.getElementById('step' + step);
  if (target) {
    target.style.display = 'block';
    target.style.animation = 'none';
    target.offsetHeight; // Force reflow
    target.style.animation = 'panelIn .4s var(--ee)';
  }
  
  // Update stepper
  document.querySelectorAll('.bp-step').forEach(s => {
    const sStep = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    if (sStep === step) s.classList.add('active');
    if (sStep < step) s.classList.add('done');
  });
  
  // Update summary
  updateSummary();
}

// Step 1: Type Selection
document.querySelectorAll('.bp-type-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.bp-type-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedType = card.dataset.type;
    updateTypeLabel();
  });
});

function updateTypeLabel() {
  const label = document.getElementById('bookingTypeLabel');
  if (label) {
    label.textContent = selectedType === 'agent' ? 'Talk to an Agent' : 'Book a Demo';
  }
}

document.getElementById('step1Next').addEventListener('click', () => {
  goToStep(2);
  renderCalendar();
});

// Step 2 nav
document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
document.getElementById('step2Next').addEventListener('click', () => {
  if (selectedDate && selectedTime) goToStep(3);
});

// Step 3 nav
document.getElementById('step3Back').addEventListener('click', () => goToStep(2));

/* ═══════════════════════════════════════════════════
   CALENDAR
   ═══════════════════════════════════════════════════ */
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  const monthYear = document.getElementById('calMonthYear');
  grid.innerHTML = '';
  
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  monthYear.textContent = calendarDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + BOOKING_CONFIG.maxAdvanceDays);
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'bp-cal-day empty';
    grid.appendChild(empty);
  }
  
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const dayEl = document.createElement('button');
    dayEl.type = 'button';
    dayEl.className = 'bp-cal-day';
    dayEl.textContent = d;
    
    const dayOfWeek = date.getDay();
    const isPastOrToday = date <= today;
    const isTooFar = date > maxDate;
    const isWeekend = BOOKING_CONFIG.weekendsDisabled && (dayOfWeek === 0 || dayOfWeek === 6);
    
    if (isPastOrToday || isTooFar || isWeekend) {
      dayEl.classList.add('disabled');
    }
    
    // Highlight today
    if (date.getTime() === today.getTime()) {
      dayEl.classList.add('today');
    }
    
    // Check if this is the selected date
    if (selectedDate) {
      const selDate = new Date(selectedDate + 'T00:00:00');
      if (date.getTime() === selDate.getTime()) {
        dayEl.classList.add('selected');
      }
    }
    
    dayEl.addEventListener('click', () => selectDate(date, dayEl));
    grid.appendChild(dayEl);
  }
}

function selectDate(date, dayEl) {
  // Update selected state
  document.querySelectorAll('.bp-cal-day').forEach(d => d.classList.remove('selected'));
  dayEl.classList.add('selected');
  
  // Store date in YYYY-MM-DD format
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  selectedDate = `${yyyy}-${mm}-${dd}`;
  selectedTime = null; // Reset time when date changes
  
  // Show time slots
  renderTimeSlots();
  
  // Update labels
  const dateLabel = document.getElementById('selectedDateLabel');
  dateLabel.textContent = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  
  // Enable/disable next
  document.getElementById('step2Next').disabled = true; // Need to pick time too
  updateSummary();
}

// Calendar navigation
document.getElementById('calPrev').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  // Don't allow going before current month
  const now = new Date();
  if (calendarDate.getFullYear() < now.getFullYear() || 
     (calendarDate.getFullYear() === now.getFullYear() && calendarDate.getMonth() < now.getMonth())) {
    calendarDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

/* ═══════════════════════════════════════════════════
   TIME SLOTS
   ═══════════════════════════════════════════════════ */
function generateTimeSlots() {
  const slots = [];
  for (let h = BOOKING_CONFIG.workingHoursStart; h < BOOKING_CONFIG.workingHoursEnd; h++) {
    for (let m = 0; m < 60; m += BOOKING_CONFIG.slotDuration) {
      const hour24 = String(h).padStart(2, '0');
      const min = String(m).padStart(2, '0');
      const time24 = `${hour24}:${min}`;
      
      // Convert to 12-hour for display
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayTime = `${String(hour12).padStart(2, '0')}:${min} ${ampm}`;
      
      slots.push({ time24, displayTime });
    }
  }
  return slots;
}

function renderTimeSlots() {
  const section = document.getElementById('timeSection');
  const grid = document.getElementById('timeGrid');
  section.style.display = 'block';
  grid.innerHTML = '';
  
  const allSlots = generateTimeSlots();
  const bookedSlots = getBookedSlots();
  
  // Check if selected date is today (to disable past slots)
  const now = new Date();
  const isToday = selectedDate === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  
  allSlots.forEach(slot => {
    const slotKey = makeSlotKey(selectedDate, slot.time24, selectedType);
    const isBooked = bookedSlots.includes(slotKey);
    
    // Check if slot is in the past (for today)
    let isPast = false;
    if (isToday) {
      const [h, m] = slot.time24.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      if (slotTime <= now) isPast = true;
    }
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bp-time-slot';
    btn.textContent = slot.displayTime;
    
    if (isBooked || isPast) {
      btn.classList.add('booked');
      if (isBooked) btn.title = 'This slot is already booked';
      if (isPast) btn.title = 'This time has passed';
    }
    
    if (selectedTime === slot.time24) {
      btn.classList.add('selected');
    }
    
    btn.addEventListener('click', () => {
      if (isBooked || isPast) return;
      
      document.querySelectorAll('.bp-time-slot').forEach(s => s.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime = slot.time24;
      
      document.getElementById('step2Next').disabled = false;
      updateSummary();
    });
    
    grid.appendChild(btn);
  });
}

/* ═══════════════════════════════════════════════════
   SUMMARY
   ═══════════════════════════════════════════════════ */
function updateSummary() {
  const summary = document.getElementById('bookingSummary');
  
  if (selectedDate || selectedTime) {
    summary.style.display = 'block';
  }
  
  document.getElementById('sumType').textContent = selectedType === 'agent' ? '💬 Agent Call' : '📊 Demo';
  
  if (selectedDate) {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    document.getElementById('sumDate').textContent = dateObj.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }
  
  if (selectedTime) {
    // Convert time24 to display format
    const [h, m] = selectedTime.split(':').map(Number);
    const hour12 = h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    document.getElementById('sumTime').textContent = `${String(hour12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm} IST`;
  }
}

/* ═══════════════════════════════════════════════════
   FORM VALIDATION
   ═══════════════════════════════════════════════════ */
function validateFormField(input) {
  let valid = true;
  
  if (input.required && !input.value.trim()) {
    valid = false;
  }
  if (input.type === 'email' && input.value) {
    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
  }
  if (input.type === 'tel' && input.value) {
    valid = /^[0-9]{10}$/.test(input.value);
  }
  
  input.classList.toggle('error', !valid);
  return valid;
}

// Live validation
document.querySelectorAll('#bpForm input, #bpForm select, #bpForm textarea').forEach(el => {
  el.addEventListener('blur', () => validateFormField(el));
  el.addEventListener('input', () => {
    if (el.classList.contains('error')) validateFormField(el);
  });
});

// Phone: digits only
document.getElementById('bpPhone').addEventListener('input', function() {
  this.value = this.value.replace(/[^0-9]/g, '');
});

/* ═══════════════════════════════════════════════════
   FORM SUBMISSION
   ═══════════════════════════════════════════════════ */
document.getElementById('bpForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Validate
  const fields = this.querySelectorAll('[required]');
  let allValid = true;
  fields.forEach(f => { if (!validateFormField(f)) allValid = false; });
  
  if (!allValid) {
    const firstErr = this.querySelector('.error');
    if (firstErr) firstErr.focus();
    return;
  }
  
  // Build booking data
  const slotKey = makeSlotKey(selectedDate, selectedTime, selectedType);
  
  // Double-booking check
  if (getBookedSlots().includes(slotKey)) {
    alert('Sorry, this slot was just booked by someone else. Please pick another time.');
    goToStep(2);
    renderTimeSlots();
    return;
  }
  
  const data = {
    bookingType: selectedType,
    name: document.getElementById('bpName').value.trim(),
    email: document.getElementById('bpEmail').value.trim(),
    phone: document.getElementById('bpPhone').value.trim(),
    company: document.getElementById('bpCompany').value.trim(),
    notes: document.getElementById('bpNotes').value.trim(),
    date: selectedDate,
    time: selectedTime,
    slotKey: slotKey,
    status: 'pending',
    timezone: BOOKING_CONFIG.timezone,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };
  
  // Show loading
  setLoading(true);
  
  try {
    // 1. Save to localStorage (acts as local DB for MVP)
    saveBookingLocally(data);
    
    // 2. Mark slot as booked
    addBookedSlot(slotKey);
    
    // 3. Send to Google Sheets
    if (BOOKING_CONFIG.googleSheetUrl) {
      await submitToGoogleSheets(data);
    }
    
    // 4. Store for success page
    sessionStorage.setItem('growtexBooking', JSON.stringify(data));
    
    // 5. Redirect to success page
    window.location.href = 'success.html';
    
  } catch (err) {
    console.error('Booking error:', err);
    // Still save locally and redirect
    sessionStorage.setItem('growtexBooking', JSON.stringify(data));
    window.location.href = 'success.html';
  } finally {
    setLoading(false);
  }
});

/* ═══════════════════════════════════════════════════
   LOCAL STORAGE DB
   ═══════════════════════════════════════════════════ */
function saveBookingLocally(data) {
  const bookings = JSON.parse(localStorage.getItem('growtexBookings') || '[]');
  data.id = 'bk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  data.createdAt = new Date().toISOString();
  bookings.push(data);
  localStorage.setItem('growtexBookings', JSON.stringify(bookings));
  console.log('✅ Booking saved locally:', data.id);
}

/* ═══════════════════════════════════════════════════
   GOOGLE SHEETS INTEGRATION
   ═══════════════════════════════════════════════════ */
async function submitToGoogleSheets(data) {
  return new Promise((resolve) => {
    const sheetData = {
      name: data.name,
      email: data.email,
      phone: '+91' + data.phone,
      service: data.bookingType === 'agent' ? 'Talk to Agent' : 'Book a Demo',
      date: data.date,
      time: data.time,
      message: `[${data.bookingType.toUpperCase()}] Company: ${data.company || 'N/A'} | Notes: ${data.notes || 'None'}`,
      timestamp: data.timestamp,
      slotKey: data.slotKey
    };
    
    const params = new URLSearchParams(sheetData).toString();
    const url = BOOKING_CONFIG.googleSheetUrl + '?' + params;
    
    const img = new Image();
    let resolved = false;
    
    const done = () => {
      if (!resolved) {
        resolved = true;
        console.log('✅ Booking sent to Google Sheets');
        resolve();
      }
    };
    
    img.onload = done;
    img.onerror = done;
    img.src = url;
    
    setTimeout(done, 4000);
  });
}

/* ═══════════════════════════════════════════════════
   UI HELPERS
   ═══════════════════════════════════════════════════ */
function setLoading(isLoading) {
  const btn = document.getElementById('bpSubmitBtn');
  btn.disabled = isLoading;
  btn.querySelector('.bp-submit-text').style.display = isLoading ? 'none' : 'inline';
  btn.querySelector('.bp-submit-loading').style.display = isLoading ? 'inline-flex' : 'none';
}

/* ═══════════════════════════════════════════════════
   NAV BOOKING BUTTON (on this page, scroll to top)
   ═══════════════════════════════════════════════════ */
const navBookBtn = document.getElementById('navBookBtn');
if (navBookBtn) {
  navBookBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    goToStep(1);
  });
}

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
console.log('✅ GrowteX Booking Page loaded');
