const addBtn = document.getElementById('add-entry-btn');
const entriesList = document.getElementById('entries-list');
const entryDate = document.getElementById('entry-date');
const entryText = document.getElementById('entry-text');
const moodPicker = document.getElementById('mood-picker');
const toggleBtn = document.getElementById('toggle-entries-btn');
const themeColorPicker = document.getElementById('theme-color');

let entries = JSON.parse(localStorage.getItem('entries')) || [];

// Render all entries
function renderEntries() {
    entriesList.innerHTML = '';
    entries.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'entry-item';

        li.innerHTML = `
            <div class="entry-top">
                <span class="entry-mood">${entry.mood}</span>
                <span class="entry-date">${entry.date}</span>
            </div>
            <span class="entry-text">${entry.text}</span>
            <div class="entry-buttons">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Delete
        li.querySelector('.delete-btn').addEventListener('click', () => {
            entries.splice(index, 1);
            saveAndRender();
        });

        // Edit
        li.querySelector('.edit-btn').addEventListener('click', () => {
            const newText = prompt("Edit your entry:", entry.text);
            if (newText !== null && newText.trim() !== '') {
                entries[index].text = newText;
                saveAndRender();
            }
        });

        entriesList.appendChild(li);
    });
}

// Save to localStorage & render
function saveAndRender() {
    localStorage.setItem('entries', JSON.stringify(entries));
    renderEntries();
}

// Add new entry
addBtn.addEventListener('click', () => {
    const date = entryDate.value;
    const text = entryText.value.trim();
    const mood = moodPicker.value;
    if (!date || !text || !mood) {
        alert("Please fill date, mood, and entry.");
        return;
    }
    entries.push({ date, text, mood });
    entryText.value = '';
    entryDate.value = '';
    moodPicker.value = '';
    saveAndRender();

    // Slide down entries automatically when a new entry is added
if (!entriesContainer.classList.contains('show')) {
    entriesContainer.classList.add('show');
    toggleBtn.textContent = "Hide Previous Entries";
}

    // Show entries if hidden
if (entriesContainer.classList.contains('hidden')) {
    entriesContainer.classList.remove('hidden');
    toggleBtn.textContent = "Hide Previous Entries";
}
});

const entriesContainer = document.getElementById('entries-container');

// Toggle entries visibility
toggleBtn.addEventListener('click', () => {
    entriesContainer.classList.toggle('show'); // toggle slide effect
    toggleBtn.textContent = entriesContainer.classList.contains('show') ? "Hide Previous Entries" : "Show Previous Entries";
});

// Theme selector
themeColorPicker.addEventListener('input', () => {
    document.documentElement.style.setProperty('--theme-color', themeColorPicker.value);
    document.querySelectorAll('.large-btn').forEach(btn => btn.style.backgroundColor = themeColorPicker.value);
    document.querySelectorAll('.large-btn').forEach(btn => btn.addEventListener('mouseover', () => {
        btn.style.backgroundColor = themeColorPicker.value;
    }));
});

// Initial render
renderEntries();
