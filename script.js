document.addEventListener("DOMContentLoaded", () => {

  /* ---------- PAGE CONTROL ---------- */
  const pages = document.querySelectorAll(".page");
  const showPage = id => {
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };

  /* ---------- USER ---------- */
  continueBtn.onclick = () => {
    const name = usernameInput.value.trim();
    if (!name) return alert("Enter your name");
    localStorage.setItem("user", name);
    greetText.innerText = `Hello ${name} 👋`;
    showPage("page-home");
  };

  /* ---------- NAV ---------- */
  goEmotion.onclick = () => showPage("page-emotion");
  goInfo.onclick = () => showPage("page-info");
  backHome.onclick = backFromInfo.onclick = () => showPage("page-home");

  /* ---------- MENU ---------- */
  menuBtn.onclick = () => menuPanel.classList.remove("hidden");
  closeMenu.onclick = () => menuPanel.classList.add("hidden");

  /* ---------- DARK MODE ---------- */
  darkToggle.onchange = () =>
    document.body.classList.toggle("dark");

  /* ---------- CAMERA ---------- */
  let stream, facing = "user";

  startCamera.onclick = async () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing }
    });
    video.srcObject = stream;
    video.style.display = "block";
    preview.style.display = "none";
  };

  switchCamera.onclick = () => {
    facing = facing === "user" ? "environment" : "user";
    startCamera.onclick();
  };

  /* ---------- IMAGE UPLOAD ---------- */
  uploadImage.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      preview.src = r.result;
      preview.style.display = "block";
      video.style.display = "none";
    };
    r.readAsDataURL(file);
  };

  /* ---------- MODEL ---------- */
  let model;
  tf.loadLayersModel("./model/model.json").then(m => model = m);

  const emotions = [
    "Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"
  ];

  /* ✅ RANDOM MESSAGES PER EMOTION */
  const emotionMessages = {
    Happy: [
      "Happiness grows when shared with others.",
      "Joy often reflects comfort and safety.",
      "Positive emotions support social connection."
    ],
    Sad: [
      "Sadness can appear during emotional overload.",
      "It’s okay to slow down and reflect.",
      "Supportive environments help regulate sadness."
    ],
    Fear: [
      "Fear may be caused by uncertainty or low lighting.",
      "Calm surroundings help reduce fear.",
      "Gradual exposure builds confidence."
    ],
    Angry: [
      "Anger often comes from frustration.",
      "Structured routines help emotional control.",
      "Clear communication reduces anger."
    ],
    Surprise: [
      "Surprise is triggered by sudden changes.",
      "Predictability improves emotional comfort.",
      "Unexpected stimuli affect reactions."
    ],
    Disgust: [
      "Disgust may relate to sensory sensitivity.",
      "Gradual exposure improves tolerance.",
      "Sensory awareness is important."
    ],
    Neutral: [
      "Neutral does not mean lack of emotion.",
      "Calm states support focus and learning.",
      "Emotional expression varies across people."
    ]
  };

  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");

  let history = JSON.parse(localStorage.getItem("history") || "[]");

  /* ---------- ANALYZE ---------- */
  analyzeEmotion.onclick = async () => {
    if (!model) return alert("Model loading");

    const src =
      video.style.display === "block" ? video :
      preview.style.display === "block" ? preview : null;

    if (!src) return alert("Start camera or upload image");

    ctx.drawImage(src, 0, 0, 48, 48);

    const t = tf.browser.fromPixels(canvas)
      .mean(2)
      .toFloat()
      .div(255)
      .expandDims(0)
      .expandDims(-1);

    const d = await model.predict(t).data();
    const max = Math.max(...d);
    const idx = d.indexOf(max);

    if (max < 0.4) {
      emotionResult.innerText = "No clear face detected";
      emotionHint.innerText = "Improve lighting or move closer";
      return;
    }

    const emotion = emotions[idx];
    const confidence = (max * 100).toFixed(1);

    const msgs = emotionMessages[emotion];
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];

    emotionResult.innerText = `Emotion: ${emotion}`;
    emotionHint.innerText =
      `Confidence: ${confidence}%\n"${randomMsg}"`;

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

  function updateMenu() {
    const count = {};
    history.forEach(h => count[h.emotion] = (count[h.emotion] || 0) + 1);

    mostEmotion.innerText =
      Object.keys(count).sort((a,b)=>count[b]-count[a])[0] || "–";

    let m=0,a=0,e=0;
    history.forEach(h => h.hour<12?m++:h.hour<18?a++:e++);
    timeSummary.innerText = `Morning:${m}, Afternoon:${a}, Evening:${e}`;

    historyList.innerHTML = history.slice(-10).reverse()
      .map(h=>`<li>${h.emotion} – ${h.date}</li>`).join("");
  }

  updateMenu();
});
