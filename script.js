const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const resultText = document.getElementById("result");
const factText = document.getElementById("fact");

let model;

// PAGE SWITCH
function showPage(num) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(`page${num}`).classList.add("active");

  if (num === 3) {
    const name = sessionStorage.getItem("username");
    document.getElementById("greeting").innerText = `Hello ${name} 👋`;
  }
}

// SAVE USER DATA (LOCAL ONLY)
function saveUser() {
  const name = document.getElementById("name").value;
  if (!name) {
    alert("Please enter your name");
    return;
  }
  sessionStorage.setItem("username", name);
  showPage(2);
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

// EMOTIONS + EMOJIS
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

// ANALYZE
document.getElementById("analyzeBtn").onclick = async () => {
  const img = captureFrame();
  const prediction = model.predict(img);
  const data = await prediction.data();

  const index = data.indexOf(Math.max(...data));
  const emotion = emotions[index];

  resultText.innerText =
    `Detected Emotion: ${emotion.name} ${emotion.emoji}`;

  const facts = emotionFacts[emotion.name];
  factText.innerText =
    facts[Math.floor(Math.random() * facts.length)];
};

