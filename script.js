let timer;
let breakTimer;
let timeLeft;
let isRunning = false;
let titleClicks = 0;

const display = document.getElementById("timerDisplay");
const message = document.getElementById("message");
const themeSelect = document.getElementById("themeSelect");
const minutesInput = document.getElementById("minutesInput");
const taskName = document.getElementById("taskName");
const ding = document.getElementById("ding");

/* Load saved state */
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("studyState"));
  if (saved) {
    timeLeft = saved.timeLeft;
    isRunning = false;
    taskName.value = saved.task || "";
    themeSelect.value = saved.theme || "calm";
    minutesInput.value = saved.duration || 25;
    document.body.className = saved.theme;
    updateDisplay();
  } else {
    timeLeft = 25 * 60;
    updateDisplay();
  }
};

/* Save state */
function saveState() {
  localStorage.setItem("studyState", JSON.stringify({
    timeLeft,
    task: taskName.value,
    theme: themeSelect.value,
    duration: minutesInput.value
  }));
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  display.textContent = formatTime(timeLeft);
}

document.getElementById("startBtn").onclick = () => {
  if (isRunning) return;
  isRunning = true;
  message.textContent = "Focus mode activated";

  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    saveState();

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      ding.play();
      message.textContent = "Nice work. Want a 5 minute break?";
      startBreakOption();
    }
  }, 1000);
};

document.getElementById("pauseBtn").onclick = () => {
  clearInterval(timer);
  isRunning = false;
  message.textContent = "Paused";
  saveState();
};

document.getElementById("resetBtn").onclick = () => {
  clearInterval(timer);
  isRunning = false;
  timeLeft = minutesInput.value * 60;
  updateDisplay();
  message.textContent = "";
  saveState();
};

minutesInput.oninput = () => {
  if (!isRunning) {
    timeLeft = minutesInput.value * 60;
    updateDisplay();
    saveState();
  }
};

/* Auto pause on tab out */
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning) {
    clearInterval(timer);
    isRunning = false;
    message.textContent = "Paused when you switched tabs";
    saveState();
  }
});

/* Theme */
themeSelect.onchange = () => {
  document.body.className = themeSelect.value;
  saveState();
};

/* Break timer */
function startBreakOption() {
  breakTimer = setTimeout(() => {
    message.textContent = "";
  }, 8000);
}

/* Easter egg */
document.getElementById("title").onclick = () => {
  titleClicks++;
  if (titleClicks === 5) {
    message.textContent = "Secret unlocked, breathe for a moment";
    titleClicks = 0;
  }
};

/* Continuous save */
setInterval(saveState, 3000);
