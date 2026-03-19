/* ══════════════════════════════════════════════════════════════
   GROWTEX VENTURES — ADMIN DASHBOARD
   Login, booking management, stats, filtering
   ══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   ADMIN CREDENTIALS (MVP — In production, use backend)
   ═══════════════════════════════════════════════════ */
const ADMIN_CREDS = {
  email: 'admin@growtex.in',
  password: 'growtex2025'
};

const JWT_KEY = 'growtexAdminToken';

/* ═══════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════ */
function isLoggedIn() {
  const token = localStorage.getItem(JWT_KEY);
  if (!token) return false;
  try {
    const data = JSON.parse(atob(token));
    // Token expires in 8 hours
    if (Date.now() - data.ts > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(JWT_KEY);
      return false;
    }
    return true;
  } catch { return false; }
}

function login(email, password) {
  if (email === ADMIN_CREDS.email && password === ADMIN_CREDS.password) {
    const token = btoa(JSON.stringify({ email, ts: Date.now() }));
    localStorage.setItem(JWT_KEY, token);
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(JWT_KEY);
  showLogin();
}

function getLoggedInEmail() {
  try {
    const token = localStorage.getItem(JWT_KEY);
    return JSON.parse(atob(token)).email;
  } catch { return ''; }
}

/* ═══════════════════════════════════════════════════
   SCREEN SWITCHING
   ═══════════════════════════════════════════════════ */
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('dashUser').textContent = getLoggedInEmail();
  loadBookings();
}

/* ═══════════════════════════════════════════════════
   LOGIN FORM
   ═══════════════════════════════════════════════════ */
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value;
  
  if (login(email, pass)) {
    document.getElementById('loginError').style.display = 'none';
    showDashboard();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

document.getElementById('logoutBtn').addEventListener('click', logout);

/* ═══════════════════════════════════════════════════
   BOOKINGS DATA
   ═══════════════════════════════════════════════════ */
function getAllBookings() {
  try {
    return JSON.parse(localStorage.getItem('growtexBookings') || '[]');
  } catch { return []; }
}

function saveAllBookings(bookings) {
  localStorage.setItem('growtexBookings', JSON.stringify(bookings));
}

function updateBookingStatus(id, status) {
  const bookings = getAllBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx > -1) {
    bookings[idx].status = status;
    bookings[idx].updatedAt = new Date().toISOString();
    saveAllBookings(bookings);
  }
  loadBookings();
}

function deleteBooking(id) {
  if (!confirm('Are you sure you want to delete this booking?')) return;
  let bookings = getAllBookings();
  
  // Also remove from booked slots
  const booking = bookings.find(b => b.id === id);
  if (booking && booking.slotKey) {
    let slots = JSON.parse(localStorage.getItem('growtexBookedSlots') || '[]');
    slots = slots.filter(s => s !== booking.slotKey);
    localStorage.setItem('growtexBookedSlots', JSON.stringify(slots));
  }
  
  bookings = bookings.filter(b => b.id !== id);
  saveAllBookings(bookings);
  loadBookings();
}

/* ═══════════════════════════════════════════════════
   RENDER BOOKINGS
   ═══════════════════════════════════════════════════ */
function loadBookings() {
  const bookings = getAllBookings();
  updateStats(bookings);
  renderTable(applyFilters(bookings));
}

function updateStats(bookings) {
  const today = new Date().toISOString().split('T')[0];
  
  document.getElementById('statTotal').textContent = bookings.length;
  document.getElementById('statToday').textContent = bookings.filter(b => b.date === today).length;
  document.getElementById('statDemo').textContent = bookings.filter(b => b.bookingType === 'demo').length;
  document.getElementById('statAgent').textContent = bookings.filter(b => b.bookingType === 'agent').length;
  document.getElementById('statPending').textContent = bookings.filter(b => b.status === 'pending').length;
  document.getElementById('statCompleted').textContent = bookings.filter(b => b.status === 'completed').length;
}

function applyFilters(bookings) {
  const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
  const typeVal = document.getElementById('filterType').value;
  const statusVal = document.getElementById('filterStatus').value;
  const dateVal = document.getElementById('filterDate').value;
  
  return bookings.filter(b => {
    // Search
    if (searchVal) {
      const searchable = `${b.name} ${b.email} ${b.company || ''} ${b.phone}`.toLowerCase();
      if (!searchable.includes(searchVal)) return false;
    }
    // Type
    if (typeVal !== 'all' && b.bookingType !== typeVal) return false;
    // Status
    if (statusVal !== 'all' && b.status !== statusVal) return false;
    // Date
    if (dateVal && b.date !== dateVal) return false;
    
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
}

function renderTable(bookings) {
  const tbody = document.getElementById('bookingsBody');
  
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr class="dash-empty-row">
        <td colspan="10">
          <div class="dash-empty">
            <span>📭</span>
            <p>No bookings match your filters.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = bookings.map(b => {
    // Type badge
    const typeBadge = `<span class="type-badge ${b.bookingType}">${b.bookingType}</span>`;
    
    // Status badge
    const statusBadge = `<span class="status-badge ${b.status}">${b.status}</span>`;
    
    // Format date
    let dateDisplay = b.date || '—';
    if (b.date) {
      try {
        const dateObj = new Date(b.date + 'T00:00:00');
        dateDisplay = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {}
    }
    
    // Format time
    let timeDisplay = b.time || '—';
    if (b.time) {
      const [h, m] = b.time.split(':').map(Number);
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      timeDisplay = `${String(hour12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
    }
    
    // Actions
    let actions = '';
    if (b.status === 'pending') {
      actions += `<button class="dash-action-btn complete" onclick="updateBookingStatus('${b.id}', 'completed')" title="Mark completed">✓</button>`;
      actions += `<button class="dash-action-btn cancel" onclick="updateBookingStatus('${b.id}', 'cancelled')" title="Cancel">✗</button>`;
    }
    if (b.status === 'cancelled') {
      actions += `<button class="dash-action-btn complete" onclick="updateBookingStatus('${b.id}', 'pending')" title="Reopen">↩</button>`;
    }
    actions += `<button class="dash-action-btn delete" onclick="deleteBooking('${b.id}')" title="Delete">🗑</button>`;
    
    return `
      <tr>
        <td>${typeBadge}</td>
        <td><strong>${escapeHtml(b.name)}</strong></td>
        <td>${escapeHtml(b.email)}</td>
        <td>+91 ${escapeHtml(b.phone)}</td>
        <td>${escapeHtml(b.company || '—')}</td>
        <td>${dateDisplay}</td>
        <td>${timeDisplay}</td>
        <td>${statusBadge}</td>
        <td style="max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(b.notes || '')}">${escapeHtml(b.notes || '—')}</td>
        <td style="white-space:nowrap;">${actions}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/* ═══════════════════════════════════════════════════
   FILTERS
   ═══════════════════════════════════════════════════ */
document.getElementById('searchInput').addEventListener('input', loadBookings);
document.getElementById('filterType').addEventListener('change', loadBookings);
document.getElementById('filterStatus').addEventListener('change', loadBookings);
document.getElementById('filterDate').addEventListener('change', loadBookings);
document.getElementById('refreshBtn').addEventListener('click', loadBookings);

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
if (isLoggedIn()) {
  showDashboard();
} else {
  showLogin();
}

console.log('✅ GrowteX Admin Dashboard loaded');
