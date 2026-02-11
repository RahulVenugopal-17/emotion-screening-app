const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const previewImg = document.getElementById("previewImg");
const resultText = document.getElementById("result");
const confidenceText = document.getElementById("confidence");
const historyList = document.getElementById("history");

const emotionBox = document.getElementById("emotionBox");
const infoBox = document.getElementById("infoBox");
const backFromInfo = document.getElementById("backFromInfo");
const backFromCam = document.getElementById("backFromCam");
const darkToggle = document.getElementById("darkToggle");

const startCam = document.getElementById("startCam");
const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageInput");
const analyzeBtn = document.getElementById("analyzeBtn");

let model;
let uploadedTensor = null;

/* ---------- PAGE NAV ---------- */
function showPage(n) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(`page${n}`).classList.add("active");
}

/* ---------- DARK MODE ---------- */
darkToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
};
if (localStorage.getItem("dark") === "true") {
  document.body.classList.add("dark");
}

/* ---------- NAV BUTTONS ---------- */
emotionBox.onclick = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Please enter your name");
  localStorage.setItem("username", name);
  document.getElementById("greeting").innerText = `Hello ${name} 👋`;
  loadHistory();
  showPage(3);
};

infoBox.onclick = () => showPage(2);
backFromInfo.onclick = () => showPage(1);
backFromCam.onclick = () => showPage(1);

/* ---------- CAMERA ---------- */
startCam.onclick = async () => {
  uploadedTensor = null;
  previewImg.style.display = "none";
  video.style.display = "block";
  video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
};

/* ---------- IMAGE UPLOAD ---------- */
uploadBtn.onclick = () => imageInput.click();

imageInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }

  const img = new Image();
  img.onload = () => {
    previewImg.src = img.src;
    previewImg.style.display = "block";
    video.style.display = "none";
    uploadedTensor = preprocessImage(img);
  };
  img.src = URL.createObjectURL(file);
};

/* ---------- MODEL ---------- */
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
}
loadModel();

/* ---------- PREPROCESS ---------- */
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function captureFrame() {
  ctx.drawImage(video, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2).toFloat().div(255)
    .expandDims(0).expandDims(-1);
}

function preprocessImage(img) {
  ctx.drawImage(img, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2).toFloat().div(255)
    .expandDims(0).expandDims(-1);
}

/* ---------- EMOTIONS ---------- */
const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];

/* ---------- ANALYZE (DOUBLE VERIFIED) ---------- */
analyzeBtn.onclick = async () => {
  if (!model) return alert("Model not loaded");

  resultText.innerText = "Analyzing...";
  confidenceText.innerText = "";

  let totals = new Array(7).fill(0);
  const frames = 10;

  for (let i = 0; i < frames; i++) {
    const input = uploadedTensor ? uploadedTensor : captureFrame();
    const pred = model.predict(input);
    const data = await pred.data();
    data.forEach((v, j) => totals[j] += v);
    await new Promise(r => setTimeout(r, 100));
  }

  const avg = totals.map(v => v / frames);
  const max = Math.max(...avg);
  const idx = avg.indexOf(max);

  const emotion = emotions[idx];
  const confidence = (max * 100).toFixed(1);

  resultText.innerText = `Emotion: ${emotion}`;
  confidenceText.innerText = `Confidence: ${confidence}%`;

  saveHistory(emotion, confidence);
  loadHistory();
};

/* ---------- HISTORY (OFFLINE) ---------- */
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
  historyList.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `${h.time} → ${h.emotion} (${h.confidence}%)`;
    historyList.appendChild(li);
  });
}
