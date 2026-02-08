const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const resultText = document.getElementById("result");
const confidenceText = document.getElementById("confidence");
const historyList = document.getElementById("history");

let model;

// ---------- NAV ----------
function showPage(n) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(`page${n}`).classList.add("active");
}

// ---------- DARK MODE ----------
document.getElementById("darkToggle").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
};
if (localStorage.getItem("dark") === "true") document.body.classList.add("dark");

// ---------- BUTTON BINDINGS ----------
document.getElementById("emotionBox").onclick = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Enter your name");
  localStorage.setItem("username", name);
  document.getElementById("greeting").innerText = `Hello ${name} 👋`;
  loadHistory();
  showPage(3);
};

document.getElementById("infoBox").onclick = () => showPage(2);
document.getElementById("backFromInfo").onclick = () => showPage(1);
document.getElementById("backFromCam").onclick = () => showPage(1);

// ---------- CAMERA ----------
document.getElementById("startCam").onclick = async () => {
  video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
};

// ---------- MODEL ----------
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
}
loadModel();

// ---------- PREPROCESS ----------
const canvas = document.createElement("canvas");
canvas.width = 48; canvas.height = 48;
const ctx = canvas.getContext("2d");

function captureFrame() {
  ctx.drawImage(video, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2).toFloat().div(255)
    .expandDims(0).expandDims(-1);
}

// ---------- EMOTIONS ----------
const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];

// ---------- ANALYSIS (DOUBLE VERIFY) ----------
document.getElementById("analyze").onclick = async () => {
  resultText.innerText = "Analyzing...";
  let totals = new Array(7).fill(0);

  for (let i = 0; i < 10; i++) {
    const pred = model.predict(captureFrame());
    const data = await pred.data();
    data.forEach((v, j) => totals[j] += v);
    await new Promise(r => setTimeout(r, 100));
  }

  const avg = totals.map(v => v / 10);
  const max = Math.max(...avg);
  const idx = avg.indexOf(max);

  const emotion = emotions[idx];
  const confidence = (max * 100).toFixed(1);

  resultText.innerText = `Emotion: ${emotion}`;
  confidenceText.innerText = `Confidence: ${confidence}%`;

  saveHistory(emotion, confidence);
  loadHistory();
};

// ---------- HISTORY ----------
function saveHistory(emotion, confidence) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.unshift({ emotion, confidence, time: new Date().toLocaleString() });
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
