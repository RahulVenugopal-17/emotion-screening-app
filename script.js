const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const resultText = document.getElementById("result");
const factText = document.getElementById("fact");

let model;

// PAGE NAVIGATION
function showPage(n) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(`page${n}`).classList.add("active");
}

// NAME → EMOTION PAGE
function goToEmotion() {
  const name = document.getElementById("name").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }
  document.getElementById("greeting").innerText = `Hello ${name} 👋`;
  showPage(3);
}

// CAMERA
document.getElementById("startBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
};

// LOAD MODEL
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
}
loadModel();

// PREPROCESS
const canvas = document.createElement("canvas");
canvas.width = 48;
canvas.height = 48;
const ctx = canvas.getContext("2d");

function captureFrame() {
  ctx.drawImage(video, 0, 0, 48, 48);
  return tf.browser.fromPixels(canvas)
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

// EMOTIONS
const emotions = [
  { name: "Angry", emoji: "😠" },
  { name: "Disgust", emoji: "🤢" },
  { name: "Fear", emoji: "😨" },
  { name: "Happy", emoji: "😊" },
  { name: "Sad", emoji: "😢" },
  { name: "Surprise", emoji: "😲" },
  { name: "Neutral", emoji: "😐" }
];

// FACTS
const emotionFacts = {
  Happy: ["Positive emotions support social engagement."],
  Sad: ["Emotional support helps regulate sadness."],
  Fear: ["Calm environments reduce anxiety."],
  Angry: ["Anger may result from communication difficulty."],
  Neutral: ["Neutral does not mean lack of emotion."],
  Surprise: ["Predictable routines improve comfort."],
  Disgust: ["Sensory sensitivity may trigger discomfort."]
};

// DOUBLE-VERIFIED ANALYSIS
document.getElementById("analyzeBtn").onclick = async () => {
  if (!model) {
    alert("Model not loaded");
    return;
  }

  resultText.innerText = "Analyzing...";
  factText.innerText = "";

  const frames = 10;
  const delay = 100;
  let totals = new Array(emotions.length).fill(0);

  for (let i = 0; i < frames; i++) {
    const img = captureFrame();
    const pred = model.predict(img);
    const data = await pred.data();

    data.forEach((v, j) => totals[j] += v);
    await new Promise(r => setTimeout(r, delay));
  }

  const avg = totals.map(v => v / frames);
  const idx = avg.indexOf(Math.max(...avg));
  const emotion = emotions[idx];

  resultText.innerText = `Detected Emotion: ${emotion.name} ${emotion.emoji}`;
  factText.innerText = emotionFacts[emotion.name][0];
};
