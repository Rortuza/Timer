/* ---------------------------
   AURA MINUTES - FINAL STABLE BUILD
   --------------------------- */

/* Ripple effect */
function attachRipple(button) {
  button.addEventListener("click", function(e) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
}

let timer;
let timeLeft;
let isRunning = false;
let titleClicks = 0;
let sessionDurationSeconds;
let idleTimeout;
let ambientParticles = [];
let confettiPieces = [];

const display = document.getElementById("timerDisplay");
const message = document.getElementById("message");
const encouragementBox = document.getElementById("encouragement");
const minutesInput = document.getElementById("minutesInput");
const taskName = document.getElementById("taskName");
const music = document.getElementById("music");
const musicInput = document.getElementById("musicInput");
const loopToggle = document.getElementById("loopToggle");
const notes = document.getElementById("notes");
const ding = document.getElementById("ding");
const container = document.getElementById("container");
const titleEl = document.getElementById("title");
const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d");

/* Encouragements */
const encouragements = [
  "You are doing better than you think.",
  "Breathe, then keep going.",
  "Small steps still count.",
  "This is progress.",
  "You are capable, even on slow days.",
  "Your effort matters.",
  "Take it steady, you got this.",
  "Proud of you for showing up.",
  "Focus grows strength.",
  "Keep moving, even gently."
];

/* ------------------------------------------
   SAFE INITIALIZATION
   ------------------------------------------ */

window.onload = () => {
  resizeCanvas();
  initAmbientParticles();
  drawScene();
  resetIdleTimer();

  const saved = JSON.parse(localStorage.getItem("studyState"));

  if (
    saved &&
    Number.isFinite(Number(saved.timeLeft)) &&
    Number(saved.timeLeft) > 1 &&
    Number.isFinite(Number(saved.duration)) &&
    Number(saved.duration) >= 1 &&
    Number(saved.duration) <= 180
  ) {
    timeLeft = Number(saved.timeLeft);
    minutesInput.value = Number(saved.duration);
    taskName.value = saved.task || "";
    notes.value = saved.notes || "";
  } else {
    localStorage.removeItem("studyState");
    timeLeft = 25 * 60;
    minutesInput.value = 25;
    taskName.value = "";
    notes.value = "";
  }

  sessionDurationSeconds = Number(minutesInput.value) * 60;

  updateTitles();
  updateDisplay();
  updateBackgroundGradient();

  document.querySelectorAll("button").forEach(attachRipple);

  setupListeners();

  setInterval(saveState, 4000);
};

/* ------------------------------------------
   EVENT LISTENERS
   ------------------------------------------ */

function setupListeners() {
  taskName.addEventListener("input", () => {
    updateTitles();
    saveState();
  });

  notes.addEventListener("input", saveState);

  minutesInput.addEventListener("input", () => {
    let val = Number(minutesInput.value);
    if (!val || val < 1) val = 1;
    if (val > 180) val = 180;

    minutesInput.value = val;

    if (!isRunning) {
      sessionDurationSeconds = val * 60;
      timeLeft = sessionDurationSeconds;
      updateDisplay();
      updateBackgroundGradient();
      saveState();
    }
  });

  loopToggle.addEventListener("change", () => {
    music.loop = loopToggle.checked;
  });

  musicInput.addEventListener("change", () => {
    const file = musicInput.files[0];
    if (!file) return;
    music.src = URL.createObjectURL(file);
    music.play();
  });

  document.getElementById("startBtn").onclick = startTimer;
  document.getElementById("pauseBtn").onclick = pauseTimer;
  document.getElementById("resetBtn").onclick = resetTimer;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isRunning) {
      pauseTimer();
      message.textContent = "Paused when you switched tabs";
      saveState();
    }
  });

  titleEl.onclick = () => {
    titleClicks++;
    if (titleClicks === 5) {
      encouragementBox.textContent = "Secret unlocked. Take a gentle breath.";
      titleClicks = 0;
    }
  };

  setInterval(() => {
    if (isRunning) showEncouragement();
  }, 90000);

  window.addEventListener("beforeunload", (e) => {
    if (isRunning) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

/* ------------------------------------------
   CORE FUNCTIONS
   ------------------------------------------ */

function saveState() {
  localStorage.setItem("studyState", JSON.stringify({
    timeLeft,
    task: taskName.value,
    duration: minutesInput.value,
    notes: notes.value
  }));
}

function updateTitles() {
  const task = taskName.value.trim();
  if (task) {
    titleEl.textContent = task;
    document.title = `${task} • Aura Minutes`;
  } else {
    titleEl.textContent = "Aura Minutes";
    document.title = "Aura Minutes";
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateDisplay() {
  display.textContent = formatTime(timeLeft);
}

function showEncouragement() {
  encouragementBox.textContent =
    encouragements[Math.floor(Math.random() * encouragements.length)];
}

function updateBackgroundGradient() {
  const progress = 1 - timeLeft / sessionDurationSeconds;

  const hue1 = 310 - progress * 25;
  const hue2 = 270 - progress * 20;

  document.body.style.background =
    `linear-gradient(120deg, hsl(${hue1}, 90 percent, 88 percent), hsl(${hue2}, 75 percent, 80 percent))`;
}

function resetIdleTimer() {
  titleEl.classList.remove("idle");
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    if (!isRunning) titleEl.classList.add("idle");
  }, 20000);
}

/* ------------------------------------------
   TIMER
   ------------------------------------------ */

function startTimer() {
  if (isRunning) return;

  isRunning = true;
  container.classList.add("active");
  message.textContent = "Focus mode on";
  showEncouragement();

  if (!sessionDurationSeconds || sessionDurationSeconds < 1) {
    sessionDurationSeconds = Number(minutesInput.value) * 60 || 1500;
  }

  timer = setInterval(() => {
    timeLeft--;

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateDisplay();
      clearInterval(timer);
      isRunning = false;

      container.classList.remove("active");
      ding.play();
      message.textContent = "Session complete";
      showEncouragement();
      spawnConfetti();
      saveState();
      return;
    }

    updateDisplay();
    updateBackgroundGradient();
    saveState();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;
  container.classList.remove("active");
  message.textContent = "Paused";
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  container.classList.remove("active");

  sessionDurationSeconds = Number(minutesInput.value) * 60 || 1500;
  timeLeft = sessionDurationSeconds;

  confettiPieces = [];
  updateDisplay();
  updateBackgroundGradient();
  encouragementBox.textContent = "";
  message.textContent = "";
  saveState();
}

/* ------------------------------------------
   PARTICLES + CONFETTI
   ------------------------------------------ */

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", () => {
  resizeCanvas();
  initAmbientParticles();
});

function initAmbientParticles() {
  ambientParticles = [];
  const count = 60;

  for (let i = 0; i < count; i++) {
    ambientParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      speedY: Math.random() * 0.4 + 0.1,
      alpha: Math.random() * 0.4 + 0.2
    });
  }
}

function spawnConfetti() {
  confettiPieces = [];
  const count = 160;

  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: Math.random() * 6 + 4,
      color: `hsl(${Math.random() * 360}, 80 percent, 70 percent)`,
      speedY: Math.random() * 3 + 2,
      life: Math.random() * 120 + 60
    });
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ambientParticles.forEach(p => {
    p.y += p.speedY;
    if (p.y > canvas.height) p.y = -10;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });

  ctx.globalAlpha = 1;

  confettiPieces.forEach(p => {
    p.y += p.speedY;
    p.life--;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  confettiPieces = confettiPieces.filter(p => p.life > 0);

  requestAnimationFrame(drawScene);
}

