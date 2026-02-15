/***********************
 * PAGE CONTROL
 ***********************/
const pages = document.querySelectorAll(".page");

function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");
}

/***********************
 * USER & NAVIGATION
 ***********************/
const usernameInput = document.getElementById("usernameInput");
const continueBtn = document.getElementById("continueBtn");
const greetText = document.getElementById("greetText");

const goEmotion = document.getElementById("goEmotion");
const goInfo = document.getElementById("goInfo");
const backHome = document.getElementById("backHome");
const backFromInfo = document.getElementById("backFromInfo");

continueBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }
  localStorage.setItem("userName", name);
  greetText.innerText = `Hello ${name} 👋`;
  showPage("page-home");
};

goEmotion.onclick = () => showPage("page-emotion");
goInfo.onclick = () => showPage("page-info");
backHome.onclick = () => showPage("page-home");
backFromInfo.onclick = () => showPage("page-home");

/***********************
 * THREE-DOT MENU
 ***********************/
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
const closeMenu = document.getElementById("closeMenu");

menuBtn.onclick = () => menuPanel.classList.remove("hidden");
closeMenu.onclick = () => menuPanel.classList.add("hidden");

/***********************
 * DARK MODE
 ***********************/
const darkToggle = document.getElementById("darkToggle");

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
  darkToggle.checked = true;
}

darkToggle.onchange = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
};

/***********************
 * CAMERA HANDLING
 ***********************/
const video = document.getElementById("video");
const preview = document.getElementById("preview");
const startCameraBtn = document.getElementById("startCamera");
const switchCameraBtn = document.getElementById("switchCamera");

let stream = null;
let facingMode = "user"; // front camera

async function startCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode }
    });

    video.srcObject = stream;
    video.style.display = "block";
    preview.style.display = "none";
  } catch (err) {
    alert("Camera access failed");
    console.error(err);
  }
}

startCameraBtn.onclick = startCamera;

switchCameraBtn.onclick = () => {
  facingMode = facingMode === "user" ? "environment" : "user";
  startCamera();
};

/***********************
 * IMAGE UPLOAD
 ***********************/
const uploadInput = document.getElementById("uploadImage");

uploadInput.onchange = e => {
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

/***********************
 * MODEL LOADING
 ***********************/
let model = null;

async function loadModel() {
  try {
    model = await tf.loadLayersModel("./model/model.json");
    console.log("Emotion model loaded");
  } catch (e) {
    console.error("Model load error", e);
  }
}
loadModel();

/***********************
 * EMOTION ANALYSIS
 ***********************/
const analyzeBtn = document.getElementById("analyzeEmotion");
const emotionResult = document.getElementById("emotionResult");
const emotionHint = document.getElementById("emotionHint");

const emotions = [
  "Angry 😠",
  "Disgust 🤢",
  "Fear 😨",
  "Happy 😊",
  "Sad 😢",
  "Surprise 😲",
  "Neutral 😐"
];

// canvas for preprocessing
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

// local history
let emotionHistory = JSON.parse(
  localStorage.getItem("emotionHistory") || "[]"
);

analyzeBtn.onclick = async () => {
  if (!model) {
    alert("Model is still loading");
    return;
  }

  let source = null;
  if (video.style.display === "block") {
    source = video;
    if (video.readyState < 2) {
      alert("Camera not ready yet");
      return;
    }
  } else if (preview.style.display === "block") {
    source = preview;
  } else {
    alert("Start camera or upload an image first");
    return;
  }

  ctx.drawImage(source, 0, 0, 48, 48);

  const input = tf.browser
    .fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);

  const prediction = model.predict(input);
  const data = await prediction.data();

  const maxVal = Math.max(...data);
  const index = data.indexOf(maxVal);

  if (maxVal < 0.4) {
    emotionResult.innerText = "No clear face detected";
    emotionHint.innerText =
      "Improve lighting or bring your face closer for better accuracy.";
    return;
  }

  const detectedEmotion = emotions[index];
  const confidence = (maxVal * 100).toFixed(1);

  emotionResult.innerText = `Emotion: ${detectedEmotion}`;
  emotionHint.innerText = `Confidence: ${confidence}%`;

  // save history
  const now = new Date();
  emotionHistory.push({
    emotion: detectedEmotion,
    hour: now.getHours(),
    date: now.toDateString()
  });

  localStorage.setItem(
    "emotionHistory",
    JSON.stringify(emotionHistory)
  );

  updateInsights();
};

/***********************
 * INSIGHTS (MENU)
 ***********************/
const mostEmotion = document.getElementById("mostEmotion");
const timeSummary = document.getElementById("timeSummary");
const historyList = document.getElementById("historyList");

function updateInsights() {
  if (emotionHistory.length === 0) {
    mostEmotion.innerText = "–";
    timeSummary.innerText = "–";
    historyList.innerHTML = "";
    return;
  }

  // most frequent emotion
  const counts = {};
  emotionHistory.forEach(e => {
    counts[e.emotion] = (counts[e.emotion] || 0) + 1;
  });

  mostEmotion.innerText = Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a]
  )[0];

  // time-based summary
  let morning = 0,
    afternoon = 0,
    evening = 0;

  emotionHistory.forEach(e => {
    if (e.hour < 12) morning++;
    else if (e.hour < 18) afternoon++;
    else evening++;
  });

  timeSummary.innerText = `Morning: ${morning}, Afternoon: ${afternoon}, Evening: ${evening}`;

  // history list
  historyList.innerHTML = emotionHistory
    .slice(-10)
    .reverse()
    .map(
      e => `<li>${e.emotion} – ${e.date}</li>`
    )
    .join("");
}

// init insights on load
updateInsights();
