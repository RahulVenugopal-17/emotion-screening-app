const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");

let model;
let currentCamera = "user";
let stream = null;

// ---------- NAV ----------
function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goHome() { showPage("page1"); }
function goToEmotion() { showPage("page2"); }
function goToInfo() { showPage("page3"); }

// ---------- START ----------
function startApp() {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return alert("Enter your name");

  localStorage.setItem("username", name);
  document.getElementById("menuUser").innerText = `Hello ${name} 👋`;
  goToEmotion();
}

// ---------- MENU ----------
function toggleMenu() {
  document.getElementById("menu").classList.toggle("open");
}

// ---------- THEME ----------
function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

// ---------- CAMERA ----------
async function startCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentCamera }
  });
  video.srcObject = stream;
}

function switchCamera() {
  currentCamera = currentCamera === "user" ? "environment" : "user";
  startCamera();
}

// ---------- GALLERY ----------
function openGallery() {
  document.getElementById("imageUpload").click();
}

// ---------- MODEL ----------
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
}
loadModel();

// ---------- ANALYSIS ----------
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function preprocess(source) {
  ctx.drawImage(source, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];

async function analyzeEmotion() {
  const img = preprocess(video);
  const pred = model.predict(img);
  const data = await pred.data();

  const idx = data.indexOf(Math.max(...data));
  const confidence = (data[idx] * 100).toFixed(1);

  document.getElementById("result").innerText =
    `Emotion: ${emotions[idx]}`;
  document.getElementById("confidence").innerText =
    `Confidence: ${confidence}%`;

  document.getElementById("hint").innerText =
    confidence < 60
      ? "Improve lighting or bring your face closer"
      : "Good detection conditions";

  saveHistory(emotions[idx], confidence);
}

function analyzeImage(e) {
  const img = new Image();
  img.onload = () => analyzeEmotionFromImage(img);
  img.src = URL.createObjectURL(e.target.files[0]);
}

async function analyzeEmotionFromImage(img) {
  const tensor = preprocess(img);
  const pred = model.predict(tensor);
  const data = await pred.data();

  const idx = data.indexOf(Math.max(...data));
  const confidence = (data[idx] * 100).toFixed(1);

  document.getElementById("result").innerText =
    `Emotion: ${emotions[idx]}`;
  document.getElementById("confidence").innerText =
    `Confidence: ${confidence}%`;
}

// ---------- HISTORY ----------
function saveHistory(emotion, confidence) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.push({ emotion, confidence, time: new Date().toLocaleString() });
  localStorage.setItem("history", JSON.stringify(history));
}

function showHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  alert(history.map(h => `${h.time} - ${h.emotion} (${h.confidence}%)`).join("\n"));
}

function clearHistory() {
  localStorage.removeItem("history");
  alert("History cleared");
}
