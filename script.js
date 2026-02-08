const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const resultText = document.getElementById("result");
const factText = document.getElementById("fact");

let model;

/* ---------- PAGE SWITCH ---------- */
function showPage(num) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(`page${num}`).classList.add("active");

  if (num === 3) {
    const name = sessionStorage.getItem("username");
    document.getElementById("greeting").innerText = `Hello ${name} 👋`;
  }
}

/* ---------- LOGIN / SIGNUP ---------- */
async function saveUser() {
  const name = nameVal();
  const email = emailVal();
  const password = passwordVal();

  if (!name || !email || !password) {
    alert("Fill all required fields");
    return;
  }

  sessionStorage.setItem("username", name);

  try {
    let { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const res = await supabaseClient.auth.signUp({ email, password });
      if (res.error) {
        alert(res.error.message);
        return;
      }
    }

    showPage(2);
  } catch (e) {
    alert("Auth error: " + e.message);
  }
}

/* ---------- INPUT HELPERS ---------- */
const nameVal = () => document.getElementById("name").value;
const emailVal = () => document.getElementById("email").value;
const passwordVal = () => document.getElementById("password").value;

/* ---------- CAMERA ---------- */
document.getElementById("startBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
};

/* ---------- LOAD MODEL ---------- */
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
    .mean(2)
    .toFloat()
    .div(255)
    .expandDims(0)
    .expandDims(-1);
}

/* ---------- EMOTIONS ---------- */
const emotions = [
  { name: "Angry", emoji: "😠" },
  { name: "Disgust", emoji: "🤢" },
  { name: "Fear", emoji: "😨" },
  { name: "Happy", emoji: "😊" },
  { name: "Sad", emoji: "😢" },
  { name: "Surprise", emoji: "😲" },
  { name: "Neutral", emoji: "😐" }
];

/* ---------- FACTS ---------- */
const emotionFacts = {
  Happy: ["Positive emotions support social bonding."],
  Sad: ["Sadness may indicate overload."],
  Fear: ["Fear relates to sensory sensitivity."],
  Angry: ["Anger may reflect frustration."],
  Neutral: ["Neutral does not mean no emotion."],
  Surprise: ["Unexpected stimuli trigger surprise."],
  Disgust: ["Sensory discomfort can cause disgust."]
};

/* ---------- TEMPORAL AVERAGING ---------- */
document.getElementById("analyzeBtn").onclick = analyzeEmotion;

async function analyzeEmotion() {
  resultText.innerText = "Analyzing...";
  const indices = [];
  const start = Date.now();

  while (Date.now() - start < 2000) {
    indices.push(await predictSingleFrame());
    await sleep(200);
  }

  const idx = dominant(indices);
  const emotion = emotions[idx];

  resultText.innerText =
    `Detected Emotion: ${emotion.name} ${emotion.emoji}`;

  factText.innerText =
    emotionFacts[emotion.name][0];

  await supabaseClient.from("emotion_history").insert({
    emotion: emotion.name
  });
}

/* ---------- PREDICTION ---------- */
async function predictSingleFrame() {
  const img = captureFrame();
  const prediction = model.predict(img);
  const data = await prediction.data();
  return data.indexOf(Math.max(...data));
}

/* ---------- HELPERS ---------- */
function dominant(list) {
  const map = {};
  list.forEach(i => map[i] = (map[i] || 0) + 1);
  return Object.keys(map).reduce((a, b) => map[a] > map[b] ? a : b);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
