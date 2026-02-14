const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const result = document.getElementById("result");
const confidenceText = document.getElementById("confidence");
const hint = document.getElementById("hint");
const historyList = document.getElementById("history");

let stream;
let cameraFacing = "user";
let emotionModel;
let faceLoaded = false;

/* PAGE SWITCH */
function showPage(n) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById("page" + n).classList.add("active");
}

/* SAVE NAME */
function saveName() {
  const name = document.getElementById("username").value;
  if (!name) return alert("Enter your name");
  localStorage.setItem("username", name);
  document.getElementById("userLabel").innerText = "Hello " + name;
}

/* CAMERA */
async function startCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: cameraFacing }
  });

  video.srcObject = stream;
}

function switchCamera() {
  cameraFacing = cameraFacing === "user" ? "environment" : "user";
  startCamera();
}

/* LOAD MODELS */
async function loadModels() {
  emotionModel = await tf.loadLayersModel("./model/model.json");
  await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
  faceLoaded = true;
}
loadModels();

/* FACE CHECK */
async function facePresent() {
  if (!faceLoaded) return false;

  const detection = await faceapi.detectSingleFace(
    video,
    new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
  );

  return detection !== undefined;
}

/* EMOTION */
async function analyzeEmotion() {
  const hasFace = await facePresent();

  if (!hasFace) {
    result.innerText = "❌ No face detected";
    confidenceText.innerText = "";
    hint.innerText = "Improve lighting or move closer to the camera";
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  canvas.getContext("2d").drawImage(video, 0, 0, 48, 48);

  const img = tf.browser.fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);

  const preds = await emotionModel.predict(img).data();
  const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];

  const i = preds.indexOf(Math.max(...preds));
  const conf = (preds[i] * 100).toFixed(1);

  result.innerText = "Emotion: " + emotions[i];
  confidenceText.innerText = "Confidence: " + conf + "%";
  hint.innerText = conf < 50 ? "Improve lighting or face position" : "";

  saveHistory(emotions[i], conf);
}

/* HISTORY */
function saveHistory(e, c) {
  const h = JSON.parse(localStorage.getItem("history") || "[]");
  h.push(`${e} (${c}%)`);
  localStorage.setItem("history", JSON.stringify(h));
  loadHistory();
}

function loadHistory() {
  historyList.innerHTML = "";
  const h = JSON.parse(localStorage.getItem("history") || "[]");
  h.forEach(x => historyList.innerHTML += `<li>${x}</li>`);
}

function clearHistory() {
  localStorage.removeItem("history");
  loadHistory();
}

/* DRAWER */
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("overlay");

menuBtn.onclick = () => {
  drawer.classList.add("open");
  overlay.classList.add("show");
};

closeBtn.onclick = overlay.onclick = () => {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
};

loadHistory();
