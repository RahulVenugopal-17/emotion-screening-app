const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const preview = document.getElementById("preview");
const resultText = document.getElementById("result");
const confidenceText = document.getElementById("confidence");

let model;
let useFront = true;
let stream = null;
let uploadedTensor = null;

// ---------------- NAVIGATION ----------------
function showPage(n) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(`page${n}`).classList.add("active");
}

// ---------------- MENU ----------------
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
}

// ---------------- THEME ----------------
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark"));
}
if (localStorage.getItem("theme") === "true") {
  document.body.classList.add("dark");
}

// ---------------- START APP ----------------
function startApp() {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }

  localStorage.setItem("user", name);
  document.getElementById("menuUser").innerText = `Hello ${name} 👋`;
  document.getElementById("greeting").innerText = `Hello ${name}`;
  loadHistory();
  showPage(3);
}

// ---------------- CAMERA ----------------
async function startCamera() {
  uploadedTensor = null;
  preview.style.display = "none";
  video.style.display = "block";

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: useFront ? "user" : "environment" }
  });

  video.srcObject = stream;
}

function switchCamera() {
  useFront = !useFront;
  startCamera();
}

// ---------------- IMAGE UPLOAD ----------------
function loadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }

  const img = new Image();
  img.onload = () => {
    preview.src = img.src;
    preview.style.display = "block";
    video.style.display = "none";
    uploadedTensor = preprocess(img);
  };
  img.src = URL.createObjectURL(file);
}

// ---------------- MODEL LOAD ----------------
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
}
loadModel();

// ---------------- PREPROCESS ----------------
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function preprocess(source) {
  ctx.drawImage(source, 0, 0, 48, 48);
  return tf.browser
    .fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

// ---------------- EMOTION ANALYSIS ----------------
const emotions = [
  "Angry",
  "Disgust",
  "Fear",
  "Happy",
  "Sad",
  "Surprise",
  "Neutral"
];

async function analyzeEmotion() {
  if (!model) {
    alert("Model still loading, please wait");
    return;
  }

  let totals = new Array(7).fill(0);

  // Temporal averaging (10 frames)
  for (let i = 0; i < 10; i++) {
    const input = uploadedTensor || preprocess(video);
    const data = await model.predict(input).data();

    data.forEach((v, j) => totals[j] += v);
    await new Promise(r => setTimeout(r, 100));
  }

  const avg = totals.map(v => v / 10);
  const maxVal = Math.max(...avg);
  const index = avg.indexOf(maxVal);

  const emotion = emotions[index];
  const confidence = (maxVal * 100).toFixed(1);

  // --- DISPLAY RESULT ---
  resultText.innerText = `Detected Emotion: ${emotion}`;
  confidenceText.innerText = `Confidence: ${confidence}%`;

  // --- GUIDANCE MESSAGE ---
  if (confidence < 60) {
    confidenceText.innerText +=
      "\n⚠️ For better accuracy, improve lighting, keep your face closer, and look directly at the camera.";
  } else {
    confidenceText.innerText +=
      "\n✅ Detection confidence is good.";
  }

  saveHistory(emotion, confidence);
  loadHistory();
}

// ---------------- HISTORY ----------------
function saveHistory(emotion, confidence) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.unshift({
    emotion,
    confidence,
    time: new Date().toLocaleString()
  });

  localStorage.setItem("history", JSON.stringify(history.slice(0, 10)));
}

function loadHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      `${item.time} – ${item.emotion} (${item.confidence}%)`;
    list.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem("history");
  loadHistory();
}
