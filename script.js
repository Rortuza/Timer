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
const splash = document.getElementById("splash");

const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d");

/* Encouragement pool */

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

/* Utility */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  if (timeLeft < 0) timeLeft = 0;
  display.textContent = formatTime(timeLeft);
}

/* Titles */

function updateTitles() {
  const task = taskName.value.trim();
  if (task.length > 0) {
    titleEl.textContent = task;
    document.title = task + " • Aura Minutes";
  } else {
    titleEl.textContent = "Aura Minutes";
    document.title = "Aura Minutes";
  }
}

/* State persistence */

function saveState() {
  localStorage.setItem("studyState", JSON.stringify({
    timeLeft,
    task: taskName.value,
    duration: minutesInput.value,
    notes: notes.value
  }));
}

/* Background gradient shifting */

function updateBackgroundGradient() {
  if (!sessionDurationSeconds || sessionDurationSeconds <= 0) return;
  const progress = 1 - timeLeft / sessionDurationSeconds;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const hueStart = 310 - clamped * 25;
  const hueEnd = 270 - clamped * 20;
  document.body.style.background = `linear-gradient(120deg, hsl(${hueStart}, 90%, 88%), hsl(${hueEnd}, 75%, 80%))`;
}

/* Ambient particles and confetti */

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

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
      color: `hsl(${Math.random() * 360}, 80%, 70%)`,
      speedY: Math.random() * 3 + 2,
      life: Math.random() * 120 + 60
    });
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ambientParticles.forEach(p => {
    p.y += p.speedY;
    if (p.y > canvas.height + 10) p.y = -10;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });

  ctx.globalAlpha = 1;

  confettiPieces.forEach(p => {
    p.y += p.speedY;
    p.life -= 1;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  confettiPieces = confettiPieces.filter(p => p.life > 0);

  requestAnimationFrame(drawScene);
}

/* Idle detection */

function resetIdleTimer() {
  titleEl.classList.remove("idle");
  if (idleTimeout) clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    if (!isRunning) {
      titleEl.classList.add("idle");
    }
  }, 20000);
}

/* Button ripple */

function attachRipple(button) {
  button.addEventListener("click", function (e) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
}

/* On load */

window.onload = () => {
  resizeCanvas();
  initAmbientParticles();
  drawScene();

  setTimeout(() => {
    splash.classList.add("hidden");
  }, 800);

  const saved = JSON.parse(localStorage.getItem("studyState"));
  if (saved) {
    timeLeft = saved.timeLeft;
    if (!Number.isFinite(timeLeft) || timeLeft <= 0) {
      timeLeft = 25 * 60;
    }
    taskName.value = saved.task || "";
    minutesInput.value = saved.duration || 25;
    notes.value = saved.notes || "";
  } else {
    timeLeft = 25 * 60;
  }

  sessionDurationSeconds = Number(minutesInput.value) * 60;
  updateTitles();
  updateDisplay();
  updateBackgroundGradient();
  resetIdleTimer();

  document.querySelectorAll("button").forEach(attachRipple);
};

/* Resize handling */

window.addEventListener("resize", () => {
  resizeCanvas();
  initAmbientParticles();
});

/* Activity listeners */

["mousemove", "keydown", "click", "touchstart"].forEach(ev => {
  document.addEventListener(ev, resetIdleTimer);
});

/* Inputs */

taskName.addEventListener("input", () => {
  updateTitles();
  saveState();
});

minutesInput.oninput = () => {
  const val = Number(minutesInput.value);
  if (!val || val < 1) {
    minutesInput.value = 1;
  }
  if (val > 180) {
    minutesInput.value = 180;
  }
  if (!isRunning) {
    sessionDurationSeconds = Number(minutesInput.value) * 60;
    timeLeft = sessionDurationSeconds;
    updateDisplay();
    updateBackgroundGradient();
    saveState();
  }
};

notes.addEventListener("input", () => {
  saveState();
});

/* Music */

loopToggle.addEventListener("change", () => {
  music.loop = loopToggle.checked;
});

musicInput.onchange = () => {
  const file = musicInput.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    music.src = url;
    music.play();
  }
};

/* Encouragement */

function showEncouragement() {
  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
  encouragementBox.textContent = msg;
}

/* Timer controls */

document.getElementById("startBtn").onclick = () => {
  if (isRunning) return;
  isRunning = true;
  container.classList.add("active");
  message.textContent = "Focus mode on";
  showEncouragement();

  if (!sessionDurationSeconds || sessionDurationSeconds <= 0) {
    sessionDurationSeconds = Number(minutesInput.value) * 60 || 1500;
  }

  timer = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateDisplay();
      updateBackgroundGradient();
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
};

document.getElementById("pauseBtn").onclick = () => {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;
  container.classList.remove("active");
  message.textContent = "Paused";
  saveState();
};

document.getElementById("resetBtn").onclick = () => {
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
};

/* Auto pause on tab switch */

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning) {
    clearInterval(timer);
    isRunning = false;
    container.classList.remove("active");
    message.textContent = "Paused when you switched tabs";
    saveState();
  }
});

/* Easter egg */

titleEl.onclick = () => {
  titleClicks++;
  if (titleClicks === 5) {
    encouragementBox.textContent = "Secret unlocked. Take a gentle breath.";
    titleClicks = 0;
  }
};

/* Rotate encouragement every 90 seconds */

setInterval(() => {
  if (isRunning) {
    showEncouragement();
  }
}, 90000);

/* Warn before closing during active session */

window.addEventListener("beforeunload", (e) => {
  if (isRunning) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* Regular autosave */

setInterval(saveState, 4000);
