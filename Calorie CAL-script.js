function calculateCalories() {
  const gender = document.getElementById('gender').value;
  const age = parseFloat(document.getElementById('age').value);
  const height = parseFloat(document.getElementById('height').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const activity = parseFloat(document.getElementById('activity').value);

  if (!age || !height || !weight) {
    document.getElementById('result').innerText = "⚠️ Please fill all fields.";
    return;
  }

  let bmr;
  if (gender === "male") {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  const totalCalories = Math.round(bmr * activity);
  document.getElementById('result').innerText = 
    `Your estimated daily calorie need is ${totalCalories} kcal/day`;
}
