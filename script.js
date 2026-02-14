const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");

let model;
let history = JSON.parse(localStorage.getItem("history") || "[]");

// NAV
function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goHome() { showPage("page1"); }
function goToInfo() { showPage("page2"); }
function goToEmotion() { showPage("page3"); }

// MENU
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
  document.getElementById("menuOverlay").classList.toggle("show");
}
function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

// THEME
function toggleTheme() {
  document.body.classList.toggle("light");
}

// USER
function startApp() {
  const name = document.getElementById("usernameInput").value;
  if (!name) return alert("Enter name");
  localStorage.setItem("username", name);
  document.getElementById("menuUser").innerText = `Hello ${name} 👋`;
}

// CAMERA
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });
  video.srcObject = stream;
}

// MODEL
(async () => {
  model = await tf.loadLayersModel("./model/model.json");
})();

// ANALYSIS
async function analyzeEmotion() {
  if (!model) return alert("Model loading");

  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 48, 48);

  const img = tf.browser.fromPixels(canvas)
    .mean(2).toFloat().div(255)
    .expandDims(0).expandDims(-1);

  const preds = model.predict(img);
  const data = await preds.data();
  const idx = data.indexOf(Math.max(...data));
  const confidence = (data[idx] * 100).toFixed(1);

  const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];
  const emotion = emotions[idx];

  document.getElementById("result").innerText = `Emotion: ${emotion}`;
  document.getElementById("confidence").innerText = `Confidence: ${confidence}%`;

  document.getElementById("suggestion").innerText =
    confidence < 60
      ? "Improve lighting or bring face closer"
      : "Detection looks reliable";

  history.push({ emotion, time: new Date().toLocaleString() });
  localStorage.setItem("history", JSON.stringify(history));
}

// IMAGE UPLOAD
function analyzeImage(e) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 48, 48);
  };
  img.src = URL.createObjectURL(e.target.files[0]);
}

// HISTORY
function showHistory() {
  alert(history.map(h => `${h.time} - ${h.emotion}`).join("\n") || "No history");
}

function clearHistory() {
  localStorage.removeItem("history");
  history = [];
  alert("History cleared");
}
