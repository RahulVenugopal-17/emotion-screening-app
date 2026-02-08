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

/* ---------- SAVE USER + SUPABASE AUTH ---------- */
async function saveUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Please fill all required fields");
    return;
  }

  sessionStorage.setItem("username", name);

  // Try login
  let { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  // If user does not exist → signup
  if (error) {
    const res = await supabase.auth.signUp({
      email,
      password
    });
    if (res.error) {
      alert(res.error.message);
      return;
    }
  }

  showPage(2);
}

/* ---------- CAMERA ---------- */
document.getElementById("startBtn").onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
};

/* ---------- LOAD MODEL ---------- */
async function loadModel() {
  model = await tf.loadLayersModel("./model/model.json");
  console.log("Model loaded");
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
  Happy: [
    "Positive emotions encourage social engagement in autism.",
    "Happiness can improve learning and attention."
  ],
  Sad: [
    "Sadness may indicate emotional overload.",
    "Supportive environments help regulate emotions."
  ],
  Fear: [
    "Fear can be linked to sensory sensitivity.",
    "Calm settings reduce anxiety responses."
  ],
  Angry: [
    "Anger can result from communication difficulty.",
    "Structured routines help emotional regulation."
  ],
  Neutral: [
    "Neutral expression does not mean lack of emotion.",
    "Emotional expression varies widely in autism."
  ],
  Surprise: [
    "Unexpected stimuli can trigger surprise.",
    "Predictable environments improve comfort."
  ],
  Disgust: [
    "Sensory sensitivities may cause discomfort.",
    "Gradual exposure helps sensory tolerance."
  ]
};

/* ---------- TEMPORAL AVERAGING ---------- */

document.getElementById("analyzeBtn").onclick = analyzeEmotionTemporally;

async function analyzeEmotionTemporally() {
  resultText.innerText = "Analyzing...";
  const predictions = [];
  const startTime = Date.now();

  while (Date.now() - startTime < 2000) { // 2 seconds
    const emotionIndex = await predictSingleFrame();
    predictions.push(emotionIndex);
    await sleep(200); // ~5 FPS
  }

  const finalIndex = dominantIndex(predictions);
  const emotion = emotions[finalIndex];

  resultText.innerText =
    `Detected Emotion: ${emotion.name} ${emotion.emoji}`;

  const facts = emotionFacts[emotion.name];
  factText.innerText =
    facts[Math.floor(Math.random() * facts.length)];

  // Store in Supabase
  await supabase.from("emotion_history").insert({
    emotion: emotion.name
  });
}

/* ---------- SINGLE FRAME PREDICTION ---------- */
async function predictSingleFrame() {
  const img = captureFrame();
  const prediction = model.predict(img);
  const data = await prediction.data();

  return data.indexOf(Math.max(...data));
}

/* ---------- HELPERS ---------- */
function dominantIndex(list) {
  const count = {};
  list.forEach(i => count[i] = (count[i] || 0) + 1);
  return Object.keys(count).reduce((a, b) =>
    count[a] > count[b] ? a : b
  );
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

