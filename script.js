// =====================
// GLOBAL ELEMENTS
// =====================
const video = document.getElementById("video");
const resultText = document.getElementById("result");
const confidenceText = document.getElementById("confidence");
const suggestionText = document.getElementById("suggestion");
const historyList = document.getElementById("historyList");
const emotionSection = document.getElementById("emotionSection");

let model;
let stream;
let predictionsBuffer = [];

// =====================
// APP INIT
// =====================
function initApp() {
  loadModel();
  loadHistory();
  loadTheme();
}

// =====================
// MODEL
// =====================
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
  console.log("Model loaded");
}

// =====================
// NAVIGATION
// =====================
function goToEmotion() {
  const name = document.getElementById("username").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }

  localStorage.setItem("username", name);
  document.getElementById("greeting").innerText = `Hello ${name} 👋`;
  document.getElementById("menuUser").innerText = `Hello ${name} 👋`;

  emotionSection.classList.remove("hidden");
}

// =====================
// HAMBURGER MENU
// =====================
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
  document.getElementById("menuOverlay").classList.toggle("show");
}

function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

// =====================
// THEME
// =====================
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}

function loadTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
}

// =====================
// CAMERA
// =====================
async function startCamera() {
  if (stream) return;

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });

  video.srcObject = stream;
}

// =====================
// EMOTION LOGIC
// =====================
const emotions = [
  "Angry 😠",
  "Disgust 🤢",
  "Fear 😨",
  "Happy 😊",
  "Sad 😢",
  "Surprise 😲",
  "Neutral 😐"
];

const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function captureFrame() {
  ctx.drawImage(video, 0, 0, 48, 48);
  return tf.browser
    .fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

// =====================
// DOUBLE VERIFICATION
// =====================
async function analyzeEmotion() {
  if (!model || !stream) {
    alert("Start camera first");
    return;
  }

  predictionsBuffer = [];

  for (let i = 0; i < 5; i++) {
    const img = captureFrame();
    const pred = model.predict(img);
    const data = await pred.data();
    predictionsBuffer.push(data);
    await new Promise(r => setTimeout(r, 200));
  }

  const avg = averagePredictions(predictionsBuffer);
  const index = avg.indexOf(Math.max(...avg));
  const confidence = Math.round(avg[index] * 100);

  const emotion = emotions[index];

  resultText.innerText = `Detected Emotion: ${emotion}`;
  confidenceText.innerText = `Confidence: ${confidence}%`;

  suggestionText.innerText =
    confidence < 60
      ? "Improve lighting or bring your face closer for better accuracy."
      : "Good detection quality ✔";

  saveHistory(emotion, confidence);
}

// =====================
// HELPERS
// =====================
function averagePredictions(preds) {
  const avg = new Array(preds[0].length).fill(0);
  preds.forEach(p => p.forEach((v, i) => (avg[i] += v)));
  return avg.map(v => v / preds.length);
}

// =====================
// HISTORY
// =====================
function saveHistory(emotion, confidence) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.unshift({
    emotion,
    confidence,
    time: new Date().toLocaleString()
  });
  localStorage.setItem("history", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  historyList.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.forEach(h => {
    const li = document.createElement("li");
    li.innerText = `${h.emotion} (${h.confidence}%) • ${h.time}`;
    historyList.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem("history");
  loadHistory();
}
