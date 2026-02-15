// ---------- PAGE CONTROL ----------
const pages = document.querySelectorAll(".page");

function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ---------- USER ----------
let currentUser = "";

document.getElementById("continueBtn").onclick = () => {
  const name = document.getElementById("username").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }
  currentUser = name;
  showPage("page2");
};

document.getElementById("goEmotion").onclick = () => {
  document.getElementById("greet").innerText = `Hello ${currentUser} 👋`;
  showPage("page3");
};

document.getElementById("goInfo").onclick = () => showPage("page4");

document.getElementById("backHome1").onclick =
document.getElementById("backHome2").onclick =
document.getElementById("backHome3").onclick = () => showPage("page2");

// ---------- CAMERA ----------
const video = document.getElementById("video");
const preview = document.getElementById("preview");
let stream = null;
let currentFacing = "user"; // front

async function startCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacing }
  });

  video.srcObject = stream;
  video.style.display = "block";
  preview.style.display = "none";
}

document.getElementById("startCamera").onclick = startCamera;

document.getElementById("switchCamera").onclick = () => {
  currentFacing = currentFacing === "user" ? "environment" : "user";
  startCamera();
};

// ---------- IMAGE UPLOAD ----------
document.getElementById("uploadImage").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = "block";
    video.style.display = "none";
  };
  reader.readAsDataURL(file);
};

// ---------- MODEL ----------
let model;
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
}
loadModel();

// ---------- PREPROCESS ----------
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function getTensorFromSource(source) {
  ctx.drawImage(source, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

// ---------- EMOTIONS ----------
const emotions = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"];

// ---------- ANALYZE ----------
document.getElementById("analyzeEmotion").onclick = async () => {
  if (!model) {
    alert("Model not loaded yet");
    return;
  }

  let source = video.style.display === "block" ? video : preview;
  if (!source || source.readyState === 0) {
    alert("Start camera or upload an image first");
    return;
  }

  const tensor = getTensorFromSource(source);
  const prediction = model.predict(tensor);
  const data = await prediction.data();

  const max = Math.max(...data);
  const index = data.indexOf(max);
  const confidence = (max * 100).toFixed(1);

  document.getElementById("result").innerText =
    `Emotion: ${emotions[index]}`;
  document.getElementById("hint").innerText =
    confidence < 50
      ? "Improve lighting or bring face closer"
      : `Confidence: ${confidence}%`;
};
