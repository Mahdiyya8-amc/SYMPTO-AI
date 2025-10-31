const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const bmiValue = document.getElementById("bmiValue");
const bmiMessage = document.getElementById("bmiMessage");
const resultCard = document.getElementById("resultCard");
const themeToggle = document.getElementById("themeToggle");
const themeColor = document.getElementById("themeColor");

calculateBtn.addEventListener("click", () => {
  const weight = parseFloat(weightInput.value);
  const height = parseFloat(heightInput.value) / 100;

  if (!weight || !height) {
    alert("Please enter valid weight and height!");
    return;
  }

  const bmi = (weight / (height * height)).toFixed(1);
  let category = "", color = "", message = "";

  if (bmi < 18.5) {
    category = "UNDERWEIGHT";
    color = "#b30000";
    message = "You’re underweight. Eat a balanced diet!";
  } else if (bmi < 25) {
    category = "NORMAL";
    color = "#00b300";
    message = "Perfect! Keep maintaining your healthy lifestyle!";
  } else if (bmi < 30) {
    category = "OVERWEIGHT";
    color = "#ffcc00";
    message = "Slightly overweight. Try to be more active!";
  } else if (bmi < 35) {
    category = "OBESE CATEGORY - 1";
    color = "#ff6600";
    message = "Obese level 1. Consult a doctor for a plan.";
  } else {
    category = "OBESE CATEGORY - 2";
    color = "#990000";
    message = "Obese level 2. Prioritize your health now!";
  }

  bmiValue.textContent = `Your BMI is ${bmi}`;
  bmiValue.style.color = color;
  bmiMessage.textContent = message;
  resultCard.classList.remove("hidden");
});

resetBtn.addEventListener("click", () => {
  weightInput.value = "";
  heightInput.value = "";
  resultCard.classList.add("hidden");
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

themeColor.addEventListener("input", function() {
  const color = this.value;
  document.documentElement.style.setProperty("--theme-color", color);

  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  const lighter = lightenColor(color, 30);
  document.body.style.background = `linear-gradient(135deg, ${color}, ${lighter})`;
});
