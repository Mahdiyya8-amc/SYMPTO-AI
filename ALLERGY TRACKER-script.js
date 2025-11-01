/* ======= Allergies Tracker (light theme) =======
 - Replace API_KEY below with your API Ninjas key.
 - For local testing serve files with Live Server or a local server to avoid browser CORS issues.
================================================= */

/* -------- CONFIG (paste your key here) -------- */
const API_KEY = "YOUR_API_KEY_HERE"; // <-- REPLACE with your API Ninjas key
const BASE_API = "https://api.api-ninjas.com/v1/allergies?name=";

/* -------- DOM refs -------- */
const fetchBtn = document.getElementById('fetchBtn');
const queryEl = document.getElementById('query');
const loader = document.getElementById('loader');
const resultCard = document.getElementById('resultCard');
const resName = document.getElementById('resName');
const resSymptoms = document.getElementById('resSymptoms');
const resCauses = document.getElementById('resCauses');
const resPrecautions = document.getElementById('resPrecautions');
const resMedical = document.getElementById('resMedical');
const resSeverity = document.getElementById('resSeverity');
const saveFetchedBtn = document.getElementById('saveFetched');
const commonnessCanvas = document.getElementById('commonnessChart');
const commonnessNote = document.getElementById('commonnessNote');

const personalName = document.getElementById('personalName');
const personalSeverity = document.getElementById('personalSeverity');
const personalDate = document.getElementById('personalDate');
const personalNotes = document.getElementById('personalNotes');
const savePersonal = document.getElementById('savePersonal');
const toggleEntries = document.getElementById('toggleEntries');
const entriesWrap = document.getElementById('entries');

let lastFetched = null;
let entries = JSON.parse(localStorage.getItem('allergy_entries_v1') || '[]');
let donutChart = null;

/* -------- helpers -------- */
function showLoader(on=true){ loader.hidden = !on; }
function showResult(on=true){ resultCard.hidden = !on; }
function persist(){ localStorage.setItem('allergy_entries_v1', JSON.stringify(entries)); }
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* -------- Chart helpers -------- */
function renderDonut(percent){
  if (donutChart) donutChart.destroy();
  const ctx = commonnessCanvas.getContext('2d');
  const safe = Math.max(0, Math.min(100, Number(percent || 0)));
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Common', 'Not common'],
      datasets: [{ data: [safe, 100 - safe], backgroundColor: ['#4a90e2','#e6eef8'] }]
    },
    options: { cutout: '70%', plugins:{legend:{display:false}} }
  });
  commonnessNote.textContent = safe > 0 ? `Estimated commonness: ${safe}%` : 'Commonness not available';
}

function renderFallbackDonut(){
  const counts = { Mild:0, Moderate:0, Severe:0, Unknown:0 };
  entries.forEach(e => counts[e.severity || 'Unknown'] = (counts[e.severity || 'Unknown']||0) + 1);
  const labels = [], data = [], colors = [];
  if (counts.Mild) { labels.push('Mild'); data.push(counts.Mild); colors.push('#a2e3a2'); }
  if (counts.Moderate) { labels.push('Moderate'); data.push(counts.Moderate); colors.push('#ffe9a2'); }
  if (counts.Severe) { labels.push('Severe'); data.push(counts.Severe); colors.push('#f5a2a2'); }
  if (data.length === 0) { renderDonut(0); commonnessNote.textContent = 'No saved entries to show distribution.'; return; }
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(commonnessCanvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets:[{ data, backgroundColor: colors }] },
    options: { cutout: '70%', plugins:{legend:{position:'bottom'}}}
  });
  commonnessNote.textContent = 'Showing distribution from your saved entries';
}

/* -------- API fetch logic -------- */
async function fetchAllergyInfo(q){
  showLoader(true);
  showResult(false);
  lastFetched = null;

  const url = BASE_API + encodeURIComponent(q);
  try {
    // Try direct fetch (requires valid API_KEY & no CORS blockage)
    const resp = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
    if (resp.status === 401) throw new Error('invalid_key');
    if (!resp.ok) throw new Error('bad_response');
    const data = await resp.json();
    showLoader(false);
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    const normalized = {
      name: item.name || q,
      symptoms: Array.isArray(item.symptoms) ? item.symptoms.join(', ') : (item.symptoms || 'Not provided'),
      causes: Array.isArray(item.causes) ? item.causes.join(', ') : (item.causes || 'Not provided'),
      precautions: Array.isArray(item.precautions) ? item.precautions.join(', ') : (item.precautions || 'Not provided'),
      medical_attention: typeof item.medical_attention !== 'undefined' ? (item.medical_attention ? 'Yes' : 'No') : 'Unknown',
      severity: item.severity || 'Unknown',
      commonness: (item.commonness !== undefined) ? Number(item.commonness) : null
    };
    lastFetched = normalized;
    return normalized;
  } catch (err) {
    showLoader(false);
    // Distinguish invalid key vs CORS/network
    if (err.message === 'invalid_key') {
      throw new Error('invalid_key');
    }
    // network/cors: rethrow with specific message so caller can present instructions
    throw new Error('network_or_cors');
  }
}

/* -------- render fetched data -------- */
function displayFetched(item){
  if (!item) { resultCard.hidden = true; return; }
  resName.textContent = item.name;
  resSymptoms.textContent = item.symptoms;
  resCauses.textContent = item.causes;
  resPrecautions.textContent = item.precautions;
  resMedical.textContent = `${item.self_diagnosable || 'Unknown'} / ${item.medical_attention || 'Unknown'}`;
  resSeverity.textContent = `Severity: ${item.severity || 'Unknown'}`;

  if (item.commonness !== null && !isNaN(item.commonness)) {
    renderDonut(item.commonness);
  } else {
    renderFallbackDonut();
  }
  resultCard.hidden = false;
}

/* -------- save fetched as entry -------- */
saveFetchedBtn.addEventListener('click', () => {
  if (!lastFetched) return alert('No fetched allergy to save. Fetch first.');
  const ent = { id: Date.now(), name: lastFetched.name, severity: lastFetched.severity || 'Unknown', date: (new Date()).toISOString().slice(0,10), notes: '', source:'api' };
  entries.unshift(ent);
  persist(); renderEntries();
  alert('Saved fetched allergy as an entry.');
});

/* -------- personal entry save -------- */
savePersonal.addEventListener('click', () => {
  const name = personalName.value.trim() || queryEl.value.trim() || 'Custom';
  const severity = personalSeverity.value || 'Unknown';
  const date = personalDate.value || (new Date()).toISOString().slice(0,10);
  const notes = personalNotes.value.trim();
  const entry = { id: Date.now(), name, severity, date, notes, source: 'user' };
  entries.unshift(entry);
  persist(); renderEntries();
  // clear fields
  personalName.value = ''; personalSeverity.value = ''; personalDate.value = ''; personalNotes.value = '';
});

/* -------- render entries -------- */
function renderEntries(){
  entriesWrap.innerHTML = '';
 
  if (entries.length === 0) { entriesWrap.innerHTML = `<p class="muted">No entries yet. Save a fetched allergy or add a personal entry.</p>`; renderFallbackDonut(); return; }

  const frag = document.createDocumentFragment();
  entries.forEach((e, idx) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <div>
        <strong>${escapeHtml(e.name)}</strong>
        <div class="meta">${escapeHtml(e.date)} • ${escapeHtml(e.severity)} ${e.source==='api'?'• API':''}</div>
        <div style="margin-top:8px">${escapeHtml(e.notes || '')}</div>
      </div>
      <div class="controls">
        <button data-idx="${idx}" data-action="edit">✏️</button>
        <button data-idx="${idx}" data-action="delete">🗑️</button>
      </div>
    `;
    frag.appendChild(div);
  });
  entriesWrap.appendChild(frag);

  // attach handlers
  entriesWrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const idx = Number(btn.dataset.idx);
      const act = btn.dataset.action;
      if (act === 'delete') {
        if (!confirm('Delete this entry?')) return;
        entries.splice(idx,1); persist(); renderEntries();
      } else if (act === 'edit') {
        editEntry(idx);
      }
    });
  });
  renderFallbackDonut();
}

function editEntry(index){
  const e = entries[index];
  const newName = prompt('Edit name:', e.name);
  if (newName === null) return;
  const newDate = prompt('Edit date (YYYY-MM-DD):', e.date);
  if (newDate === null) return;
  const newSeverity = prompt('Edit severity (Mild/Moderate/Severe/Unknown):', e.severity);
  if (newSeverity === null) return;
  const newNotes = prompt('Edit notes:', e.notes || '');
  if (newNotes === null) return;

  entries[index].name = newName.trim();
  entries[index].date = newDate.trim();
  entries[index].severity = newSeverity.trim();
  entries[index].notes = newNotes.trim();
  persist(); renderEntries();
}

/* -------- fetch button handler -------- */
fetchBtn.addEventListener('click', async () => {
  const q = queryEl.value.trim();
  if (!q) { alert('Please type an allergy or symptoms to search.'); return; }
  try {
    showLoader(true);
    const data = await fetchAllergyInfo(q);
    showLoader(false);
    if (!data) {
      alert('No data found for that query. You can save a personal entry instead.');
      // populate result card with message
      resName.textContent = `No data found for "${q}"`;
      resSymptoms.textContent = '—'; resCauses.textContent = '—'; resPrecautions.textContent = '—';
      resMedical.textContent = '—'; resSeverity.textContent = 'Severity: —';
      renderFallbackDonut();
      resultCard.hidden = false;
      return;
    }
    displayFetched(data);
  } catch (err) {
    showLoader(false);
    if (err.message === 'invalid_key') {
      alert('API key invalid (401). Please check your API key in script.js.');
    } else if (err.message === 'network_or_cors') {
      alert('Network or CORS issue. For local testing use Live Server (VS Code) or host your page. See console for details.');
      console.error('Network/CORS error while calling API. If running locally via file:// it may be blocked by the browser.');
    } else {
      alert('Error fetching data. See console (F12) for details.');
      console.error(err);
    }
  }
});

/* ---------- Init ---------- */
(function init(){
  // render saved entries
  renderEntries();
  // initial donut blank
  renderDonut(0);
})();
