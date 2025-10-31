// === ELEMENTS ===
const themePicker = document.getElementById("theme-picker");
const resetThemeBtn = document.getElementById("reset-theme");
const themeModeToggle = document.getElementById("theme-mode-toggle");

const moodButtons = document.querySelectorAll(".mood-btn");
const entryStep = document.getElementById("entry-step");
const moodStep = document.getElementById("mood-step"); // (mood-step is the section around mood options)
const entriesContainer = document.getElementById("entries-container");
const entriesList = document.getElementById("entries-list");
const toggleEntriesBtn = document.getElementById("toggle-entries-btn");

const entryDate = document.getElementById("entry-date");
const moodPickerSelect = document.getElementById("mood-picker-select");
const entryText = document.getElementById("entry-text");
const addEntryBtn = document.getElementById("add-entry-btn");

const moodHeading = document.getElementById("mood-heading");
const moodQuoteEl = document.getElementById("mood-quote");
const currentEmojiEl = document.getElementById("current-emoji");

const rightPlaceholder = document.getElementById("right-placeholder");
const resultSection = document.getElementById("result-section");
const chartArea = document.getElementById("chart-area");
const streakInfo = document.getElementById("streak-info");

const ctx = document.getElementById("moodChart")?.getContext?.("2d");

// === STATE & STORAGE
let entries = JSON.parse(localStorage.getItem("moodEntries")) || [];
let chosenColor = localStorage.getItem("themeColor") || null;
let currentMood = localStorage.getItem("currentMood") || null;
let isDarkMode = JSON.parse(localStorage.getItem("isDarkMode")) ?? true; // default to dark base

// === Mood-specific quotes
const quotes = {
  "😄":[ "Keep smiling — your joy is contagious!", "Your smile is a superpower; use it today!", "Little joys make big days — cherish them!" ],
  "😢":[ "It’s okay to feel low; let today teach you gentle strength.", "Tears water the seeds of tomorrow's growth.", "Softly allow yourself to heal — you are not alone." ],
  "😐":[ "Balance is a quiet victory — you’re doing fine.", "A calm day resets the heart. Breathe and be.", "Small steady steps are progress too." ],
  "😠":[ "Take a breath — flames cool with time and care.", "Anger fades; your calm self will guide you next.", "Pause. Breathe. You'll find your center again." ],
  "🤩":[ "Ride the wave of your energy — create something today!", "Your excitement is contagious — spread the sparkle!", "Let this energy push you toward something wonderful." ]
};

// === CHART
let moodChart = null;
function createChart() {
  if (!ctx) return;
  const data = calculateMoodPercentages();
  moodChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Happy 😄","Sad 😢","Neutral 😐","Angry 😠","Excited 🤩"],
      datasets: [{ data, backgroundColor: ["#FFD93D","#6C63FF","#BDBDBD","#FF6B6B","#FF9F1C"] }]
    },
    options: { plugins: { legend: { position: "bottom" } } }
  });
}
function updateChart() {
  if (!moodChart) createChart();
  const data = calculateMoodPercentages();
  if (moodChart) {
    moodChart.data.datasets[0].data = data;
    moodChart.update();
  }
}

// === UTIL: contrast helper
function getContrastText(hex) {
  if (!hex) return "#eef6f6";
  const h = hex.replace("#","");
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  const yiq = (r*299 + g*587 + b*114) / 1000;
  return yiq >= 150 ? "#111" : "#fff";
}

// === THEME apply using CSS variables
function applyTheme(colorHex) {
  const root = document.documentElement;
  // gradient from chosen color to darker tint for contrast in dark mode
  const gradient = isDarkMode
    ? `linear-gradient(135deg, ${shade(colorHex,-15)} 0%, #071c1c 80%)`
    : `linear-gradient(135deg, ${colorHex} 0%, #ffffff 70%)`;
  root.style.setProperty("--theme-bg", gradient);
  root.style.setProperty("--theme-accent", colorHex);
  const contrast = getContrastText(colorHex);
  root.style.setProperty("--theme-text", contrast);
  // surface card subtle changes
  root.style.setProperty("--card-surface", isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.94)");
  localStorage.setItem("themeColor", colorHex);
  chosenColor = colorHex;
}

// tiny helper to darken/lighten color by percent (-100..100)
function shade(hex, percent) {
  const h = hex.replace("#","");
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent)/100;
  const R = Math.round((t - r) * p) + r;
  const G = Math.round((t - g) * p) + g;
  const B = Math.round((t - b) * p) + b;
  return `#${(1<<24 | (R<<16) | (G<<8) | B).toString(16).slice(1)}`;
}

// === MODE toggle (dark base vs light)
function setDarkMode(on) {
  isDarkMode = !!on;
  localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  const root = document.documentElement;
  if (isDarkMode) {
    // calm dark base
    root.style.setProperty("--theme-text", "#eef6f6");
    root.style.setProperty("--surface", "rgba(20,24,28,0.7)");
    root.style.setProperty("--card-surface", "rgba(255,255,255,0.03)");
    themeModeUI("dark");
  } else {
    root.style.setProperty("--theme-text", "#222");
    root.style.setProperty("--surface", "rgba(255,255,255,0.92)");
    root.style.setProperty("--card-surface", "rgba(255,255,255,0.96)");
    themeModeUI("light");
  }
  // reapply chosen color to maintain gradient style
  if (chosenColor) applyTheme(chosenColor);
}

function themeModeUI(mode) {
  if (mode === "dark") themeModeToggle.textContent = "☀️";
  else themeModeToggle.textContent = "🌙";
}

// === INITIALIZE UI from storage
function initializeUI() {
  // default dark-mode base
  if (isDarkMode === null) isDarkMode = true;
  setDarkMode(isDarkMode);

  // theme color load or default
  if (chosenColor) {
    themePicker.value = chosenColor;
    applyTheme(chosenColor);
  } else {
    themePicker.value = "#2b6777";
    applyTheme("#2b6777");
  }

  // mood / entry visibility
  if (currentMood) {
    showMoodSelected(currentMood, false);
  } else {
    document.getElementById("entry-step").classList.add("hidden");
  }

  displayEntries();
  if (entries.length > 0) {
    // show results panel only after entries exist
    showResultsPanel();
    createChart();
    updateChart();
    showStreak();
  }
  // small entrance animation for panels
  document.querySelectorAll(".left-panel, .right-panel").forEach(el => el.animate([{ opacity:0, transform:"translateY(8px)" }, { opacity:1, transform:"translateY(0)" }], { duration:500, easing:"cubic-bezier(.2,.9,.2,1)"}));
}

// === Show results panel (only after an entry)
function showResultsPanel() {
  rightPlaceholder.classList.add("hidden");
  resultSection.classList.remove("hidden");
  // animate in
  setTimeout(()=> resultSection.classList.add("show"), 35);
}

// === show mood selection and quote
function showMoodSelected(moodEmoji, byUser=true) {
  currentMood = moodEmoji;
  localStorage.setItem("currentMood", currentMood);
  const names = {"😄":"Happy","😢":"Sad","😐":"Neutral","😠":"Angry","🤩":"Excited"};
  const moodName = names[moodEmoji] || "Feeling";
  moodHeading.textContent = `Today you are feeling ${moodName} ${moodEmoji}`;

  const list = quotes[moodEmoji] || ["Be you."];
  const random = list[Math.floor(Math.random()*list.length)];
  moodQuoteEl.textContent = random;
  currentEmojiEl.textContent = moodEmoji;

  entryStep.classList.remove("hidden");
  // if entries exist, show results
  if (entries.length > 0) showResultsPanel();
  updateChart();
  showStreak();
}

// === MOOD BUTTON interactions
moodButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    // bouncy micro animation
    btn.animate([{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }, { transform: "translateY(0)" }], { duration: 300, easing: "cubic-bezier(.2,.9,.2,1)" });
    showMoodSelected(mood, true);
  });
});

// === Theme picker events
themePicker.addEventListener("input", (e) => {
  applyTheme(e.target.value);
});
resetThemeBtn.addEventListener("click", () => {
  themePicker.value = "#2b6777";
  applyTheme("#2b6777");
});

// === Mode toggle
themeModeToggle.addEventListener("click", () => {
  setDarkMode(!isDarkMode);
});

// === Entries display / add / edit / delete
function displayEntries() {
  entriesList.innerHTML = "";
  if (!entries || entries.length === 0) {
    entriesList.innerHTML = "<li class='center'>No entries yet.</li>";
    return;
  }
  entries.forEach((entry, idx) => {
    const li = document.createElement("li");
    li.className = "entry-item";

    const left = document.createElement("div");
    left.className = "entry-text";
    left.textContent = `${entry.date} — ${entry.mood} — ${entry.text}`;

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const edit = document.createElement("button");
    edit.className = "action-btn action-edit";
    edit.textContent = "Edit";
    edit.onclick = () => {
      const newMood = prompt("Edit mood (emoji):", entry.mood) || entry.mood;
      const newText = prompt("Edit note:", entry.text);
      if (newText !== null) {
        entries[idx].mood = newMood;
        entries[idx].text = newText;
        saveEntries();
        showMoodSelected(newMood, false);
      }
    };

    const del = document.createElement("button");
    del.className = "action-btn action-delete";
    del.textContent = "Delete";
    del.onclick = () => {
      if (confirm("Delete this entry?")) { entries.splice(idx,1); saveEntries(); }
    };

    actions.appendChild(edit);
    actions.appendChild(del);
    li.appendChild(left);
    li.appendChild(actions);
    entriesList.appendChild(li);
  });
}

function saveEntries() {
  localStorage.setItem("moodEntries", JSON.stringify(entries));
  displayEntries();
  updateChart();
  showStreak();
  if (entries.length > 0) showResultsPanel();
}

// add entry
addEntryBtn.addEventListener("click", () => {
  const date = entryDate.value;
  const mood = moodPickerSelect.value || currentMood;
  const text = entryText.value.trim();
  if (!date || !mood) { alert("Please select a date and mood."); return; }
  entries.push({ date, mood, text });
  saveEntries();

  if (entries.length === 1) showResultsPanel();

  showMoodSelected(mood, false);

  entryDate.value = ""; moodPickerSelect.value = ""; entryText.value = "";
});

// toggle entries
toggleEntriesBtn.addEventListener("click", () => {
  if (entriesContainer.classList.contains("hidden")) {
    entriesContainer.classList.remove("hidden");
    toggleEntriesBtn.textContent = "Hide Previous Entries";
  } else {
    entriesContainer.classList.add("hidden");
    toggleEntriesBtn.textContent = "Show Previous Entries";
  }
});

// === chart & streak computations
function calculateMoodPercentages() {
  const counts = {"😄":0,"😢":0,"😐":0,"😠":0,"🤩":0};
  entries.forEach(e => { if (counts[e.mood] !== undefined) counts[e.mood]++; });
  const total = entries.length || 1;
  return Object.values(counts).map(c => Math.round((c/total)*100));
}

function calculateStreak() {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a,b) => new Date(a.date)-new Date(b.date));
  let streak = 1, max = 1;
  for (let i=1;i<sorted.length;i++){
    const prev = new Date(sorted[i-1].date), curr = new Date(sorted[i].date);
    const diff = Math.round((curr-prev)/(1000*60*60*24));
    if (diff === 1) { streak++; max = Math.max(max,streak); } else if (diff > 1) streak = 1;
  }
  return max;
}
function showStreak() {
  const s = calculateStreak();
  streakInfo.textContent = s>0 ? `🔥 Current Mood Streak: ${s} day${s>1?'s':''}` : "No streak yet. Start logging daily!";
}

// === Notifications (simple)
function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(permission => { if (permission === "granted") scheduleDailyReminder(); });
}
function scheduleDailyReminder(){
  setTimeout(() => {
    if (Notification.permission === "granted") new Notification("Mood Tracker Reminder", { body: "Don't forget to log your mood today!" });
  }, 1000*60*60*24);
}

// === Init on load
window.addEventListener("load", () => {
  initializeUI();
  requestNotificationPermission();
  if (ctx) createChart();
});
