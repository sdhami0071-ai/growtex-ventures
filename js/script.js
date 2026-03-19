/* ══ CHATBOT ══ */
const fab = document.getElementById('cfab');
const cw = document.getElementById('cw');
const ccl = document.getElementById('ccl');
const msgsEl = document.getElementById('msgs');
const cin = document.getElementById('cin');
const csend = document.getElementById('csend');
const qrEl = document.getElementById('qr');

let chatOpen = false;
let hist = [];

const SYS = `You are Arya, the friendly AI agent for GrowteX Ventures — India's most execution-focused startup consultancy. Your role:
1. Answer questions about GrowteX services clearly and concisely
2. Help founders understand what they qualify for
3. Book FREE 15-minute discovery calls by collecting: first name → WhatsApp number → service interest

GrowteX Services:
- DPIIT/Startup India Certification: Government recognition unlocking Rs.50L+ funding, 18+ schemes. Filed in 72 hours.
- 80IAC Tax Exemption: 100% income tax holiday for 3 consecutive years. 
- Website Development: Custom high-converting websites. Fast delivery.
- Paid Advertising: Meta Ads, Google Ads, AI-powered ads.
- Social Media Management: 30+ content pieces/month. 4x avg engagement lift.
- Branding & UI/UX: Full brand identity systems.

Key info: WhatsApp +91 7999866007 | growtex.in | 500+ startups helped
Tone: Direct, warm, no jargon. Keep replies to 2-4 sentences max.`;

function toggle() {
  chatOpen = !chatOpen;
  cw.classList.toggle('open', chatOpen);
  fab.classList.toggle('hid', chatOpen);
  if (chatOpen && msgsEl.children.length === 0) {
    setTimeout(() => addBot("👋 Hi! I'm Arya, your GrowteX Agent. I can help you with **DPIIT certification, 80IAC tax exemptions, and digital services** — and book you a **FREE 15-min discovery call**.\n\nWhat can I help you with?"), 350);
  }
  if (chatOpen) cin.focus();
}

fab.addEventListener('click', toggle);
if(ccl) ccl.addEventListener('click', toggle);

function addBot(txt) {
  rmTyping();
  const m = document.createElement('div');
  m.className = 'msg bot';
  const f = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  m.innerHTML = `<div class="mb2">${f}</div><div class="mt2">${getTime()}</div>`;
  msgsEl.appendChild(m);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function addUsr(txt) {
  const m = document.createElement('div');
  m.className = 'msg usr';
  m.innerHTML = `<div class="mb2">${txt}</div><div class="mt2">${getTime()}</div>`;
  msgsEl.appendChild(m);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

let typEl = null;

function showTyp() {
  if (typEl) return;
  typEl = document.createElement('div');
  typEl.className = 'msg bot';
  typEl.innerHTML = '<div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div>';
  msgsEl.appendChild(typEl);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function rmTyping() {
  if (typEl) {
    typEl.remove();
    typEl = null;
  }
}

function getTime() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function sendMsg(txt) {
  if (!txt.trim()) return;
  addUsr(txt);
  cin.value = '';
  cin.style.height = 'auto';
  showTyp();
  hist.push({
    role: 'user',
    content: txt
  });
  
  // Simulated fallback for demo (In production, use secure backend proxy)
  setTimeout(() => {
    const reply = "I'm processing your request. For the fastest response, you can also **WhatsApp us directly at +91 7999866007**!";
    addBot(reply);
  }, 1000);
}

if(csend) csend.addEventListener('click', () => sendMsg(cin.value));
if(cin) {
  cin.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg(cin.value);
    }
  });
  cin.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
}
