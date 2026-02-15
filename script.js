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

  const emotions = ["Angry","Disgust","Fear","Happy","Sad","Surprise","Neutral"];

  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");

  let history = JSON.parse(localStorage.getItem("history") || "[]");

  analyzeEmotion.onclick = async () => {
    if (!model) return alert("Model loading");

    const src =
      video.style.display === "block" ? video :
      preview.style.display === "block" ? preview : null;

    if (!src) return alert("Start camera or upload image");

    ctx.drawImage(src, 0, 0, 48, 48);

    const t = tf.browser.fromPixels(canvas)
      .mean(2).toFloat().div(255)
      .expandDims(0).expandDims(-1);

    const d = await model.predict(t).data();
    const max = Math.max(...d);
    const idx = d.indexOf(max);

    if (max < 0.4) {
      emotionResult.innerText = "No clear face detected";
      emotionHint.innerText = "Improve lighting or move closer";
      return;
    }

    emotionResult.innerText = `Emotion: ${emotions[idx]}`;
    emotionHint.innerText = `Confidence: ${(max * 100).toFixed(1)}%`;

    const now = new Date();
    history.push({
      emotion: emotions[idx],
      hour: now.getHours(),
      date: now.toDateString()
    });

    localStorage.setItem("history", JSON.stringify(history));
    updateMenu();
  };

  /* ✅ CLEAR HISTORY (MENU ONLY) */
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
    history.forEach(h => h.hour < 12 ? m++ : h.hour < 18 ? a++ : e++);
    timeSummary.innerText = `Morning:${m}, Afternoon:${a}, Evening:${e}`;

    historyList.innerHTML = history.slice(-10).reverse()
      .map(h => `<li>${h.emotion} – ${h.date}</li>`).join("");
  }

  updateMenu();
});
