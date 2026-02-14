const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const resultText = document.getElementById("emotionResult");

let model = null;
let streamStarted = false;

// ---------------- PAGE NAVIGATION ----------------
function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "page-home") {
    document.getElementById("welcomeText").innerText =
      `Hello ${localStorage.getItem("username")} 👋`;
  }
}

// ---------------- SAVE NAME ----------------
function saveName() {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }
  localStorage.setItem("username", name);
  showPage("page-home");
}

// ---------------- CAMERA ----------------
async function startCamera() {
  if (streamStarted) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });

  video.srcObject = stream;
  streamStarted = true;
}

// ---------------- MODEL LOAD ----------------
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
  console.log("Model loaded");
}
loadModel();

// ---------------- PREPROCESS ----------------
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function getInputTensor() {
  ctx.drawImage(video, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

// ---------------- EMOTIONS ----------------
const emotions = [
  "Angry 😠",
  "Disgust 🤢",
  "Fear 😨",
  "Happy 😊",
  "Sad 😢",
  "Surprise 😲",
  "Neutral 😐"
];

// ---------------- ANALYZE ----------------
async function analyzeEmotion() {
  if (!model) {
    alert("Model not loaded yet");
    return;
  }

  if (!streamStarted) {
    alert("Start the camera first");
    return;
  }

  const tensor = getInputTensor();
  const prediction = model.predict(tensor);
  const data = await prediction.data();

  const maxVal = Math.max(...data);
  const index = data.indexOf(maxVal);

  if (maxVal < 0.4) {
    resultText.innerText =
      "No face detected clearly.\nImprove lighting or bring face closer.";
    return;
  }

  resultText.innerText =
    `Emotion: ${emotions[index]}\nConfidence: ${(maxVal * 100).toFixed(1)}%`;
}
