document.addEventListener("DOMContentLoaded", () => {

  /* ---------- ELEMENTS ---------- */
  const pages = document.querySelectorAll(".page");

  const startApp = document.getElementById("startApp");
  const usernameInput = document.getElementById("usernameInput");
  const continueBtn = document.getElementById("continueBtn");
  const greetText = document.getElementById("greetText");

  const goEmotion = document.getElementById("goEmotion");
  const goInfo = document.getElementById("goInfo");
  const backHome = document.getElementById("backHome");
  const backFromInfo = document.getElementById("backFromInfo");

  const menuBtn = document.getElementById("menuBtn");
  const menuPanel = document.getElementById("menuPanel");
  const closeMenu = document.getElementById("closeMenu");
  const darkToggle = document.getElementById("darkToggle");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const video = document.getElementById("video");
  const preview = document.getElementById("preview");
  const startCamera = document.getElementById("startCamera");
  const switchCamera = document.getElementById("switchCamera");
  const uploadImage = document.getElementById("uploadImage");
  const analyzeEmotion = document.getElementById("analyzeEmotion");

  const emotionResult = document.getElementById("emotionResult");
  const emotionHint = document.getElementById("emotionHint");
  const emotionInsight = document.getElementById("emotionInsight");

  const mostEmotion = document.getElementById("mostEmotion");
  const timeSummary = document.getElementById("timeSummary");
  const historyList = document.getElementById("historyList");

  /* ---------- PAGE CONTROL ---------- */
  function showPage(id) {
    pages.forEach(p => p.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) page.classList.add("active");
  }

  /* ---------- SPLASH ---------- */
  startApp.onclick = () => showPage("page-welcome");

  /* ---------- USER ---------- */
  continueBtn.onclick = () => {
    const name = usernameInput.value.trim();
    if (!name) {
      alert("Enter your name");
      return;
    }
    localStorage.setItem("user", name);
    greetText.innerText = `Hello ${name} 👋`;
    showPage("page-home");
  };

  /* ---------- NAV ---------- */
  goEmotion.onclick = () => showPage("page-emotion");
  goInfo.onclick = () => showPage("page-info");
  backHome.onclick = () => showPage("page-home");
  backFromInfo.onclick = () => showPage("page-home");

  /* ---------- MENU ---------- */
  menuBtn.onclick = () => menuPanel.classList.remove("hidden");
  closeMenu.onclick = () => menuPanel.classList.add("hidden");

  /* ---------- DARK MODE ---------- */
  darkToggle.onchange = () => {
    document.body.classList.toggle("dark");
  };

  /* ---------- CAMERA ---------- */
  let stream = null;
  let facing = "user";

  async function startCameraStream() {
    if (stream) stream.getTracks().forEach(t => t.stop());

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing }
    });

    video.srcObject = stream;
    video.style.display = "block";
    preview.style.display = "none";
  }

  startCamera.onclick = startCameraStream;

  switchCamera.onclick = () => {
    facing = facing === "user" ? "environment" : "user";
    startCameraStream();
  };

  /* ---------- IMAGE UPLOAD ---------- */
  uploadImage.onchange = e => {
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

  /* ---------- MODEL ---------- */
  let model = null;

  tf.loadLayersModel("./model/model.json")
    .then(m => model = m)
    .catch(() => alert("Failed to load emotion model"));

  const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];

  const emotionInsights = {
    Happy: ["Happiness often appears in comfortable environments."],
    Sad: ["Sadness may indicate emotional fatigue."],
    Fear: ["Fear is often caused by uncertainty or low lighting."],
    Angry: ["Anger can result from frustration or stress."],
    Surprise: ["Surprise is triggered by unexpected stimuli."],
    Disgust: ["Disgust may relate to sensory sensitivity."],
    Neutral: ["Neutral expression does not mean lack of emotion."]
  };

  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");

  let history = JSON.parse(localStorage.getItem("history") || "[]");

  /* ---------- ANALYZE ---------- */
  analyzeEmotion.onclick = async () => {
    if (!model) {
      alert("Model still loading");
      return;
    }

    const source =
      video.style.display === "block" ? video :
      preview.style.display === "block" ? preview : null;

    if (!source) {
      alert("Start camera or upload image");
      return;
    }

    ctx.drawImage(source, 0, 0, 48, 48);

    const tensor = tf.browser.fromPixels(canvas)
      .mean(2)
      .toFloat()
      .div(255)
      .expandDims(0)
      .expandDims(-1);

    const data = await model.predict(tensor).data();
    const max = Math.max(...data);
    const index = data.indexOf(max);

    if (max < 0.4) {
      emotionResult.innerText = "No clear face detected";
      emotionHint.innerText = "Improve lighting or move closer";
      emotionInsight.innerText = "";
      return;
    }

    const emotion = emotions[index];
    emotionResult.innerText = `Emotion: ${emotion}`;
    emotionHint.innerText = `Confidence: ${(max * 100).toFixed(1)}%`;
    emotionInsight.innerText = emotionInsights[emotion][0];

    const now = new Date();
    history.push({
      emotion,
      hour: now.getHours(),
      date: now.toDateString()
    });

    localStorage.setItem("history", JSON.stringify(history));
    updateMenu();
  };

  /* ---------- CLEAR HISTORY ---------- */
  clearHistoryBtn.onclick = () => {
    if (!confirm("Clear emotion history?")) return;
    history = [];
    localStorage.removeItem("history");
    updateMenu();
  };

  /* ---------- MENU UPDATE ---------- */
  function updateMenu() {
    const count = {};
    history.forEach(h => count[h.emotion] = (count[h.emotion] || 0) + 1);

    mostEmotion.innerText =
      Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "–";

    let morning = 0, afternoon = 0, evening = 0;
    history.forEach(h => {
      if (h.hour < 12) morning++;
      else if (h.hour < 18) afternoon++;
      else evening++;
    });

    timeSummary.innerText =
      `Morning: ${morning}, Afternoon: ${afternoon}, Evening: ${evening}`;

    historyList.innerHTML = history.slice(-10).reverse()
      .map(h => `<li>${h.emotion} – ${h.date}</li>`)
      .join("");
  }

  updateMenu();
});
