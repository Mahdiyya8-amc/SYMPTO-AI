// === ELEMENTS ===
const dateInput = document.getElementById("entry-date");
const moodPicker = document.getElementById("mood-picker");
const entryText = document.getElementById("entry-text");
const addEntryBtn = document.getElementById("add-entry-btn");
const entriesList = document.getElementById("entries-list");
const toggleEntriesBtn = document.getElementById("toggle-entries-btn");
const entriesContainer = document.getElementById("entries-container");
const themeColorInput = document.getElementById("theme-color");

// === LOAD EXISTING ENTRIES ===
let entries = JSON.parse(localStorage.getItem("moodEntries")) || [];

// === DISPLAY ENTRIES ===
function displayEntries() {
    entriesList.innerHTML = "";
    if (entries.length === 0) {
        entriesList.innerHTML = "<li>No entries yet.</li>";
    } else {
        entries.forEach((entry, index) => {
            const li = document.createElement("li");
            li.classList.add("entry-item");
            
            // Entry content
            const entryText = document.createElement("span");
            entryText.textContent = `${entry.date} — ${entry.mood} — ${entry.text}`;

            // === Edit Button ===
            const editBtn = document.createElement("button");
            editBtn.textContent = "✏️ Edit";
            editBtn.classList.add("edit-btn");
            editBtn.addEventListener("click", () => {
                const newMood = prompt("Edit mood (e.g., 😄, 😢, 😐, 😠, 🤩):", entry.mood);
                const newText = prompt("Edit your note:", entry.text);
                if (newMood && newText !== null) {
                    entries[index].mood = newMood;
                    entries[index].text = newText;
                    saveEntries();
                }
            });

            // === Delete Button ===
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️ Delete";
            deleteBtn.classList.add("delete-btn");
            deleteBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to delete this entry?")) {
                    entries.splice(index, 1);
                    saveEntries();
                }
            });

            // Append
            li.appendChild(entryText);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            entriesList.appendChild(li);
        });
    }
}



// === SAVE ENTRIES ===
function saveEntries() {
    localStorage.setItem("moodEntries", JSON.stringify(entries));
    displayEntries();
    updateChart();
}

function saveEntries() {
    localStorage.setItem("moodEntries", JSON.stringify(entries));
    displayEntries();
    updateChart();
    showMoodReview();
}


// === ADD ENTRY ===
addEntryBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const mood = moodPicker.value;
    const text = entryText.value.trim();

    if (!date || !mood) {
        alert("Please select a date and mood!");
        return;
    }

    entries.push({ date, mood, text });
    saveEntries();

    entryText.value = "";
    moodPicker.value = "";
    dateInput.value = "";
});

// === TOGGLE ENTRIES ===
toggleEntriesBtn.addEventListener("click", () => {
    entriesContainer.classList.toggle("show");
    toggleEntriesBtn.textContent = entriesContainer.classList.contains("show")
        ? "Hide Previous Entries"
        : "Show Previous Entries";
});

// === THEME COLOR ===
themeColorInput.addEventListener("input", e => {
    document.body.style.backgroundColor = e.target.value + "20";
    document.querySelector("h1").style.color = e.target.value;
});

// === CHART.JS MOOD PERCENTAGE ===
const ctx = document.getElementById("moodChart").getContext("2d");

function calculateMoodPercentages() {
    const moodCounts = { "😄": 0, "😢": 0, "😐": 0, "😠": 0, "🤩": 0 };
    entries.forEach(entry => {
        if (moodCounts[entry.mood] !== undefined) moodCounts[entry.mood]++;
    });
    const total = entries.length || 1;
    return Object.values(moodCounts).map(count => ((count / total) * 100).toFixed(1));
}

// Create chart
const moodChart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Happy 😄", "Sad 😢", "Neutral 😐", "Angry 😠", "Excited 🤩"],
        datasets: [{
            label: "Mood Percentage",
            data: calculateMoodPercentages(),
            backgroundColor: ["#FFD93D", "#6C63FF", "#FF6B6B", "#4ECDC4", "#FF9F1C"],
            borderWidth: 1
        }]
    },
    options: {
        plugins: {
            title: { display: true, text: "Mood Percentage Overview" },
            tooltip: {
                callbacks: {
                    label: context => `${context.label}: ${context.parsed}%`
                }
            },
            legend: { position: "bottom" }
        }
    }
});

// === UPDATE CHART ===
function updateChart() {
    const percentages = calculateMoodPercentages();
    moodChart.data.datasets[0].data = percentages;
    moodChart.data.labels = [
        `Happy 😄 (${percentages[0]}%)`,
        `Sad 😢 (${percentages[1]}%)`,
        `Neutral 😐 (${percentages[2]}%)`,
        `Angry 😠 (${percentages[3]}%)`,
        `Excited 🤩 (${percentages[4]}%)`
    ];
    moodChart.update();
}

function showMoodReview() {
    const reviewElement = document.getElementById("mood-review");
    if (entries.length === 0) {
        reviewElement.textContent = "No entries yet. Start tracking your mood!";
        return;
    }

    const moodCounts = { "😄": 0, "😢": 0, "😐": 0, "😠": 0, "🤩": 0 };
    entries.forEach(entry => {
        if (moodCounts[entry.mood] !== undefined) moodCounts[entry.mood]++;
    });

    const maxMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
    let message = "";

    switch (maxMood) {
        case "😄": message = "You’ve been mostly *Happy*! Keep up the good vibes! 🌞"; break;
        case "😢": message = "You’ve been feeling a bit *Sad*. Remember, it’s okay to rest and heal 💙"; break;
        case "😐": message = "You’re feeling *Neutral*. Try something new to lift your spirits 🌿"; break;
        case "😠": message = "You’ve been *Angry* often. Deep breaths and self-care can help 💭"; break;
        case "🤩": message = "You’re *Excited*! Life’s treating you well — keep that spark alive ✨"; break;
    }

    reviewElement.textContent = message;
}

function updateChart() {
    const percentages = calculateMoodPercentages();
    moodChart.data.datasets[0].data = percentages;
    moodChart.data.labels = [
        `Happy 😄 (${percentages[0]}%)`,
        `Sad 😢 (${percentages[1]}%)`,
        `Neutral 😐 (${percentages[2]}%)`,
        `Angry 😠 (${percentages[3]}%)`,
        `Excited 🤩 (${percentages[4]}%)`
    ];
    moodChart.update();
    showMoodReview(); // add this line too
}


// === INITIAL LOAD ===
displayEntries();
updateChart();

// === Show entries container if there are previous entries ===
if (entries.length > 0) {
    entriesContainer.classList.add("show");
    toggleEntriesBtn.textContent = "Hide Previous Entries";
}
