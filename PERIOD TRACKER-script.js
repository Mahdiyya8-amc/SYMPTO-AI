// --- THEME TOGGLE ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function setThemeDark(on){
  document.body.classList.toggle('dark', on);
  if(on){
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#f8dbe2"/>';
    themeToggle.classList.add('active');
  } else {
    themeIcon.innerHTML = '<path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#ff9fcf"/>';
    themeToggle.classList.remove('active');
  }
}
themeToggle.addEventListener('click', ()=> setThemeDark(!document.body.classList.contains('dark')));

// --- UTILITIES ---
function ordinal(n){ const s=["th","st","nd","rd"], v=n%100; return n + (s[(v-20)%10] || s[v] || s[0]); }
function formatFullDate(iso){ const d=new Date(iso); return `${ordinal(d.getDate())} ${d.toLocaleString('default',{month:'long'})} ${d.getFullYear()}`; }

// --- PHASE LOGIC ---
function determinePhase(day, cycleLen=28){
  const menstrualEnd = 5;
  const follicularEnd = 13;
  const ovulationDay = 14;
  if(day <= menstrualEnd) return {name:'Menstrual', tip:'Rest & hydrate.'};
  if(day <= follicularEnd) return {name:'Follicular', tip:'Energy rising — plan & start projects.'};
  if(day === ovulationDay) return {name:'Ovulation', tip:'You glow! Eat protein & hydrate well.'};
  return {name:'Luteal', tip:'Mood swings possible — relax & sleep early.'};
}

// --- CHART ---
const ctx = document.getElementById('cycleChart').getContext('2d');
let chart;

function createChart(cycleLen=28, day=1){
  const phases = [
    {label:'Menstrual', days:5, color:'#ffb6c1'},
    {label:'Follicular', days:9, color:'#ffc1cc'},
    {label:'Ovulation', days:2, color:'#ff99ac'},
    {label:'Luteal', days:12, color:'#fcbad3'}
  ];
  const data = phases.map(p=>p.days);
  const labels = phases.map(p=>p.label);
  const bg = phases.map(p=>p.color);
  const phaseIndex = phases.findIndex((p, i)=>{
    const prev = phases.slice(0,i).reduce((a,b)=>a+b.days,0);
    return day > prev && day <= prev + p.days;
  });

  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type:'doughnut',
    data:{labels, datasets:[{data, backgroundColor:bg, borderWidth:1}]},
    options:{
      cutout:'60%',
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:(c)=>`${labels[c.dataIndex]}: ${data[c.dataIndex]} days`}}
      }
    },
    plugins:[{
      id:'centerText',
      afterDraw(chart){
        const {ctx, width, height} = chart;
        ctx.save();
        ctx.font = 'bold 18px Poppins';
        ctx.textAlign = 'center';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text');
        const phase = labels[phaseIndex] || '—';
        ctx.fillText(`Day ${day}`, width/2, height/2 - 10);
        ctx.fillText(phase, width/2, height/2 + 15);
        ctx.restore();
      }
    }]
  });
}

// --- CALCULATE ---
const lastPeriodEl = document.getElementById('lastPeriod');
const calcBtn = document.getElementById('calcBtn');
const predictBtn = document.getElementById('predictBtn');
const dayDisplay = document.getElementById('dayDisplay');
const phasePill = document.getElementById('phasePill');
const wellnessMsg = document.getElementById('wellnessMsg');
const calcMsg = document.getElementById('calcMsg');

calcBtn.addEventListener('click', ()=>{
  const iso = lastPeriodEl.value;
  if(!iso){ calcMsg.textContent = 'Select a start date'; return; }
  const start = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today - start)/(1000*60*60*24));
  const day = (diff % 28) + 1;
  const phase = determinePhase(day);
  dayDisplay.textContent = `Day ${day}`;
  phasePill.textContent = phase.name;
  wellnessMsg.textContent = phase.tip;
  createChart(28, day);
  calcMsg.textContent = `Cycle started on ${formatFullDate(iso)}`;
});

predictBtn.addEventListener('click', ()=>{
  const iso = lastPeriodEl.value;
  if(!iso){ calcMsg.textContent = 'Select start date first'; return; }
  const next = new Date(iso);
  next.setDate(next.getDate() + 28);
  calcMsg.textContent = `Next period: ${formatFullDate(next.toISOString().slice(0,10))}`;
});

// --- ENTRIES ---
const LS_ENTRIES = 'pt_entries_v3';
let entries = JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]');
const entryForm = document.getElementById('entryForm');
const entriesList = document.getElementById('entriesList');
const deleteAllBtn = document.getElementById('deleteAll');
const exportBtn = document.getElementById('exportBtn');
const entryDate = document.getElementById('entryDate');
const entryFlow = document.getElementById('entryFlow');
const entryDuration = document.getElementById('entryDuration');
const entryNotes = document.getElementById('entryNotes');

function saveEntries(){ localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)); }

function renderEntries(){
  entriesList.innerHTML='';
  if(entries.length===0){ entriesList.innerHTML='<div class="small-muted">No entries yet.</div>'; return; }
  entries.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(e=>{
    const div=document.createElement('div');div.className='entry-row';
    div.innerHTML=`
      <div>
        <strong>${formatFullDate(e.date)}</strong> · ${e.flow} · ${e.duration} days
        <div class="small-muted">${e.notes||''}</div>
      </div>
      <div class="entry-actions">
        <button onclick="editEntry('${e.id}')">Edit</button>
        <button onclick="deleteEntry('${e.id}')">Delete</button>
      </div>`;
    entriesList.appendChild(div);
  });
}

function deleteEntry(id){
  if(!confirm('Delete this entry?')) return;
  entries = entries.filter(e=>e.id!==id);
  saveEntries(); renderEntries();
}

function editEntry(id){
  const e = entries.find(x=>x.id===id);
  if(!e) return;
  entryDate.value=e.date;
  entryFlow.value=e.flow;
  entryDuration.value=e.duration;
  entryNotes.value=e.notes;
  entries = entries.filter(x=>x.id!==id);
  saveEntries(); renderEntries();
}

entryForm.addEventListener('submit',(ev)=>{
  ev.preventDefault();
  const data={id:Math.random().toString(36).slice(2,9),date:entryDate.value,flow:entryFlow.value,duration:entryDuration.value,notes:entryNotes.value.trim()};
  entries.push(data);
  saveEntries(); renderEntries(); entryForm.reset();
});
document.getElementById('clearForm').addEventListener('click',()=>entryForm.reset());
deleteAllBtn.addEventListener('click',()=>{if(confirm('Delete all entries?')){entries=[];saveEntries();renderEntries();}});
exportBtn.addEventListener('click',()=>{
  const data=JSON.stringify(entries,null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='entries.json';a.click();
});

window.addEventListener('DOMContentLoaded',()=>{
  renderEntries();
  createChart(28,1);
});
