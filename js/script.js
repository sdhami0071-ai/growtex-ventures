/* ══ CURSOR ══ */
const cur=document.getElementById('cur'),ring=document.getElementById('cur-ring');
document.addEventListener('mousemove',e=>{
  cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px';
  setTimeout(()=>{ring.style.left=e.clientX+'px';ring.style.top=e.clientY+'px';},85);
});

/* ══ NAV SCROLL ══ */
const nav=document.getElementById('mainnav');
window.addEventListener('scroll',()=>nav.classList.toggle('sc',scrollY>50),{passive:true});

/* ══ COUNTER ANIMATION ══ */
function runCounter(el){
  const target=parseInt(el.dataset.count),sf=el.dataset.suffix||'',dur=1600,start=performance.now();
  const ease=t=>1-Math.pow(1-t,3);
  (function tick(now){
    const p=Math.min((now-start)/dur,1),v=Math.round(ease(p)*target);
    el.textContent=v+sf;if(p<1)requestAnimationFrame(tick);
  })(start);
}

/* ══ SCROLL REVEAL ══ */
const revObs=new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      e.target.classList.add('v');
      if(e.target.dataset.count)runCounter(e.target);
      revObs.unobserve(e.target);
    }
  });
},{threshold:.1});
document.querySelectorAll('.fu,[data-count]').forEach((el,i)=>{
  if(!el.classList.contains('fu')){}
  revObs.observe(el);
});

/* ══ CHATBOT ══ */
const fab=document.getElementById('cfab'),cw=document.getElementById('cw'),ccl=document.getElementById('ccl');
const msgsEl=document.getElementById('msgs'),cin=document.getElementById('cin'),csend=document.getElementById('csend'),qrEl=document.getElementById('qr');
let chatOpen=false,hist=[];

const SYS=`You are Arya, the friendly AI agent for GrowteX Ventures — India's most execution-focused startup consultancy. Your role:
1. Answer questions about GrowteX services clearly and concisely
2. Help founders understand what they qualify for
3. Book FREE 15-minute discovery calls by collecting: first name → WhatsApp number → service interest

GrowteX Services:
- DPIIT/Startup India Certification: Government recognition unlocking Rs.50L+ funding, 18+ schemes, IPR waivers. Filed in 72 hours. 90%+ approval rate. Paid service by GrowteX.
- 80IAC Tax Exemption: 100% income tax holiday for 3 consecutive years. Available to startups incorporated after April 2016. Section 56 angel tax also available. Saves Rs.20-40L+ per year.
- Website Development: Custom high-converting websites. Fast delivery. Turns visitors into customers.
- Paid Advertising: Meta Ads (Instagram/Facebook), Google Ads, AI-powered auto-optimised ads. Full-funnel campaigns.
- Social Media Management: Full management of Instagram, Facebook, WhatsApp, LinkedIn. 30+ content pieces/month. 4x avg engagement lift.
- Branding & Logo Design: Full brand identity, logo system, visual guidelines.
- UI/UX Design: User interface and experience design.

BOOKING FLOW: When someone wants to book, collect in order: (1) first name, (2) WhatsApp number, (3) which service. Then confirm: "Great! A GrowteX agent will WhatsApp you at [number] within 30 minutes."

Key info: WhatsApp +91 7999866007 | growtex.in | Hours 9am-7pm IST | 500+ startups helped

Tone: Direct, warm, no jargon. Keep replies to 2-4 sentences max. Always end with offer to book or check eligibility.`;

function toggle(){
  chatOpen=!chatOpen;cw.classList.toggle('open',chatOpen);fab.classList.toggle('hid',chatOpen);fab.setAttribute('aria-expanded',chatOpen);
  if(chatOpen&&msgsEl.children.length===0)setTimeout(()=>addBot("👋 Hi! I'm Arya, your GrowteX Agent.\n\nI can answer all your questions about **DPIIT certification, 80IAC tax exemptions, and digital services** — and book you a **FREE 15-min discovery call** with our expert.\n\nWhat can I help you with?"),350);
  if(chatOpen)cin.focus();
}
fab.addEventListener('click',toggle);ccl.addEventListener('click',toggle);

function addBot(txt){
  rmTyping();
  const m=document.createElement('div');m.className='msg bot';
  const f=txt.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  m.innerHTML=`<div class="mb2">${f}</div><div class="mt2">${getTime()}</div>`;
  msgsEl.appendChild(m);msgsEl.scrollTop=msgsEl.scrollHeight;
}
function addUsr(txt){
  const m=document.createElement('div');m.className='msg usr';
  m.innerHTML=`<div class="mb2">${txt}</div><div class="mt2">${getTime()}</div>`;
  msgsEl.appendChild(m);msgsEl.scrollTop=msgsEl.scrollHeight;
}
let typEl=null;
function showTyp(){if(typEl)return;typEl=document.createElement('div');typEl.className='msg bot';typEl.innerHTML='<div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div>';msgsEl.appendChild(typEl);msgsEl.scrollTop=msgsEl.scrollHeight;}
function rmTyping(){if(typEl){typEl.remove();typEl=null;}}
function getTime(){return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});}

async function sendMsg(txt){
  if(!txt.trim())return;
  addUsr(txt);cin.value='';cin.style.height='auto';qrEl.innerHTML='';showTyp();
  hist.push({role:'user',content:txt});
  try{
    /* NOTE: Directly calling Anthropic API from frontend will hit CORS and expose your API keys. 
       In production, move this to a secure backend proxy. */
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
        /* 'x-api-key': 'YOUR_API_KEY' // This should NOT be in the frontend! */
      },
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:SYS,messages:hist})
    });
    const d=await r.json();
    const reply=d.content?.[0]?.text||"Quick timeout — WhatsApp us directly at **+91 7999866007** and we'll respond in 30 mins!";
    hist.push({role:'assistant',content:reply});
    addBot(reply);buildQR(txt);
  }catch(e){
    addBot("Quick hiccup! 🙏 Fastest way: **WhatsApp +91 7999866007** — response in under 30 mins.");
    buildQR('','err');
  }
}

function buildQR(msg){
  const low=msg.toLowerCase();const qs=[];
  if(low.includes('dpiit')||low.includes('startup india')||low.includes('certif')){
    qs.push({l:'Am I eligible?',m:'Am I eligible for DPIIT certification?'});
    qs.push({l:'How much does it cost?',m:'How much does GrowteX charge for DPIIT?'});
  }else if(low.includes('tax')||low.includes('80iac')){
    qs.push({l:'How much can I save?',m:'How much tax can I save with 80IAC?'});
    qs.push({l:'Am I eligible?',m:'Am I eligible for 80IAC tax exemption?'});
  }else if(low.includes('website')||low.includes('digital')||low.includes('ads')){
    qs.push({l:'Get a quote',m:'I want to get a quote for digital services'});
  }
  if(!low.includes('book')&&!low.includes('call'))qs.push({l:'📞 Book Free Call',m:'I want to book a free discovery call with GrowteX'});
  qs.push({l:'💬 WhatsApp Us',m:'__wa__'});
  qs.forEach(q=>{
    const b=document.createElement('button');b.className='qrb';b.textContent=q.l;
    b.addEventListener('click',()=>q.m==='__wa__'?window.open('https://wa.me/917999866007','_blank'):sendMsg(q.m));
    qrEl.appendChild(b);
  });
}

document.querySelectorAll('.qrb').forEach(b=>b.addEventListener('click',()=>sendMsg(b.dataset.msg)));
csend.addEventListener('click',()=>sendMsg(cin.value));
cin.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg(cin.value);}});
cin.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';});
