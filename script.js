/* ---------------------------------------------
   AURA MINUTES - FULL FIXED SCRIPT
   --------------------------------------------- */

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

/* Encouragement messages */
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

/* ---------------------------------------------------------
   INIT EVERYTHING - main function called after splash hides
   --------------------------------------------------------- */
function initAura() {
  resizeCanvas();
  initAmbientParticles();
  drawScene();
  resetIdleTimer();

  const saved = JSON.parse(localStorage.getItem("studyState"));
  if (saved) {
    timeLeft = saved.timeLeft;
    if (!Number.isFinite(timeLeft) || timeLeft <= 0) timeLeft = 25 * 60;
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

  /* Attach ripple effects to buttons */
  document.querySelectorAll("button").forEach(attachRipple);

  /* INPUT LISTENERS */

  taskName.addEventListener("input", () => {
    updateTitles();
    saveState();
  });

  notes.addEventListener("input", () => saveState());

  minutesInput.addEventListener("input", () => {
    const val = Number(minutesInput.value);
    if (!val || val < 1) minutesInput.value = 1;
    if (val > 180) minutesInput.value = 180;

    if (!isRunning) {
      sessionDurationSeconds = Number(minutesInput.value) * 60;
      timeLeft = sessionDurationSeconds;
      updateDisplay();
      updateBackgroundGradient();
      saveState();
    }
  });

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

  /* BUTTON CONTROLS */

  document.getElementById("startBtn").onclick = startTimer;
  document.getElementById("pauseBtn").onclick = pauseTimer;
  document.getElementById("resetBtn").onclick = resetTimer;

  /* PAGE TAB VISIBILITY */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isRunning) {
      pauseTimer();
      message.textContent = "Paused when you switched tabs";
      saveState();
    }
  });

  /* TITLE EASTER EGG */
  titleEl.onclick = () => {
    titleClicks++;
    if (titleClicks === 5) {
      encouragementBox.textContent = "Secret unlocked. Take a gentle breath.";
      titleClicks = 0;
    }
  };

  /* ENCOURAGEMENT ROTATION */
  setInterval(() => {
    if (isRunning) showEncouragement();
  }, 90000);

  /* WARN BEFORE CLOSING */
  window.addEventListener("beforeunload", (e) => {
    if (isRunning) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  /* AUTO SAVE EVERY 4 SECONDS */
  setInterval(saveState, 4000);
}

/* ---------------------------------------------------------
   SPLASH SCREEN HANDLER - FIXED SO IT NEVER GETS STUCK
   --------------------------------------------------------- */

window.onload = () => {
  /* Always wait for DOM to fully load */
  setTimeout(() => {
    splash.classList.add("hidden");
    initAura();  
  }, 600);  
};

/* ---------------------------------------------------------
   UTILITIES AND EFFECTS
   --------------------------------------------------------- */

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
    document.title = task + " • Aura Minutes";
  } else {
    titleEl.textContent = "Aura Minutes";
    document.title = "Aura Minutes";
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  display.textContent = formatTime(timeLeft);
}

function showEncouragement() {
  encouragementBox.textContent =
    encouragements[Math.floor(Math.random() * encouragements.length)];
}

/* Background shifting more purple as time passes */
function updateBackgroundGradient() {
  if (!sessionDurationSeconds || sessionDurationSeconds <= 0) return;
  const progress = 1 - timeLeft / sessionDurationSeconds;
  const hue1 = 310 - progress * 25;
  const hue2 = 270 - progress * 20;
  document.body.style.background =
    `linear-gradient(120deg, hsl(${hue1}, 90%, 88%), hsl(${hue2}, 75%, 80%))`;
}

/* Idle pulse on title */
function resetIdleTimer() {
  titleEl.classList.remove("idle");
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    if (!isRunning) titleEl.classList.add("idle");
  }, 20000);
}

/* Ripple animation */
function attachRipple(button) {
  button.addEventListener("click", function (e) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
}

/* ---------------------------------------------------------
   TIMER FUNCTIONS
   --------------------------------------------------------- */

function startTimer() {
  if (isRunning) return;
  isRunning = true;

  container.classList.add("active");
  message.textContent = "Focus mode on";
  showEncouragement();

  if (!sessionDurationSeconds) {
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

      updateBackgroundGradient();
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
