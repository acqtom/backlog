const PASSWORD = "backlog123";
const STORAGE_KEY = "taskBacklog.tasks";
const UNLOCK_KEY = "taskBacklog.unlocked";

let tasks = [];
let activeFilter = "all";

// ---------- Auth ----------
const loginScreen = document.getElementById("loginScreen");
const appEl = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");
const lockBtn = document.getElementById("lockBtn");

function unlock() {
  sessionStorage.setItem(UNLOCK_KEY, "true");
  loginScreen.classList.add("hidden");
  appEl.classList.remove("hidden");
  passwordInput.value = "";
  loginError.classList.remove("show");
}

function lock() {
  sessionStorage.removeItem(UNLOCK_KEY);
  appEl.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (passwordInput.value === PASSWORD) {
    unlock();
  } else {
    loginError.classList.add("show");
  }
});

lockBtn.addEventListener("click", lock);

if (sessionStorage.getItem(UNLOCK_KEY) === "true") {
  unlock();
}

// ---------- Date ----------
document.getElementById("todayDate").textContent = new Date().toLocaleDateString(
  undefined,
  { weekday: "long", month: "short", day: "numeric", year: "numeric" }
);

// ---------- Storage ----------
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ---------- Elements ----------
const addTaskForm = document.getElementById("addTaskForm");
const taskInput = document.getElementById("taskInput");
const labelSelect = document.getElementById("labelSelect");
const levelSelect = document.getElementById("levelSelect");
const priorityToggle = document.getElementById("priorityToggle");
const taskList = document.getElementById("taskList");
const completedList = document.getElementById("completedList");
const emptyState = document.getElementById("emptyState");
const emptyCompleted = document.getElementById("emptyCompleted");
const filterTabs = document.getElementById("filterTabs");

let addingPriority = false;

priorityToggle.addEventListener("click", () => {
  addingPriority = !addingPriority;
  priorityToggle.classList.toggle("active", addingPriority);
  priorityToggle.innerHTML = addingPriority ? "&#9733;" : "&#9734;";
});

// ---------- Add task ----------
addTaskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text,
    label: labelSelect.value,
    level: levelSelect.value,
    priority: addingPriority,
    done: false,
    createdAt: Date.now(),
  });

  taskInput.value = "";
  addingPriority = false;
  priorityToggle.classList.remove("active");
  priorityToggle.innerHTML = "&#9734;";

  saveTasks();
  render();
  taskInput.focus();
});

// ---------- Filter tabs ----------
filterTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  [...filterTabs.querySelectorAll(".tab")].forEach((t) =>
    t.classList.toggle("active", t === btn)
  );
  render();
});

// ---------- Task actions ----------
function toggleDone(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  if (task.done) task.doneAt = Date.now();
  saveTasks();
  render();
}

function toggleStar(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.priority = !task.priority;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

// ---------- Rendering ----------
const LEVEL_RANK = { high: 3, medium: 2, low: 1 };
const LEVEL_TEXT = { high: "High", medium: "Medium", low: "Low" };

function labelClass(label) {
  return label === "Adriel" ? "label-adriel" : "label-alex";
}

function taskLevel(task) {
  return task.level || "medium";
}

function makeTaskRow(task) {
  const row = document.createElement("div");
  row.className = "task-row" + (task.done ? " done" : "") + (task.priority && !task.done ? " priority" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.done;
  checkbox.addEventListener("change", () => toggleDone(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const level = document.createElement("span");
  level.className = "task-level level-" + taskLevel(task);
  level.textContent = LEVEL_TEXT[taskLevel(task)];

  const label = document.createElement("span");
  label.className = "task-label " + labelClass(task.label);
  label.textContent = task.label;

  const star = document.createElement("button");
  star.type = "button";
  star.className = "star-btn" + (task.priority ? " active" : "");
  star.innerHTML = task.priority ? "&#9733;" : "&#9734;";
  star.title = "Toggle top priority";
  star.addEventListener("click", () => toggleStar(task.id));

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete-btn";
  del.innerHTML = "&#10005;";
  del.title = "Delete task";
  del.addEventListener("click", () => deleteTask(task.id));

  row.appendChild(checkbox);
  row.appendChild(text);
  row.appendChild(level);
  row.appendChild(label);
  row.appendChild(star);
  row.appendChild(del);
  return row;
}

function render() {
  const filtered = activeFilter === "all" ? tasks : tasks.filter((t) => t.label === activeFilter);
  const open = filtered
    .filter((t) => !t.done)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      const rankDiff = LEVEL_RANK[taskLevel(b)] - LEVEL_RANK[taskLevel(a)];
      if (rankDiff !== 0) return rankDiff;
      return b.createdAt - a.createdAt;
    });
  const done = filtered.filter((t) => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

  taskList.innerHTML = "";
  open.forEach((t) => taskList.appendChild(makeTaskRow(t)));
  emptyState.style.display = open.length ? "none" : "block";

  completedList.innerHTML = "";
  done.forEach((t) => completedList.appendChild(makeTaskRow(t)));
  emptyCompleted.style.display = done.length ? "none" : "block";

  document.getElementById("openCount").textContent = `${open.length} open`;
  document.getElementById("completedCount").textContent = `${done.length} done`;

  const adrielOpen = tasks.filter((t) => t.label === "Adriel" && !t.done).length;
  const alexOpen = tasks.filter((t) => t.label === "Alex" && !t.done).length;
  document.getElementById("adrielCount").textContent = `${adrielOpen} task${adrielOpen === 1 ? "" : "s"}`;
  document.getElementById("alexCount").textContent = `${alexOpen} task${alexOpen === 1 ? "" : "s"}`;

  const totalAll = activeFilter === "all" ? tasks.length : tasks.filter((t) => t.label === activeFilter).length;
  const doneAll = activeFilter === "all" ? tasks.filter((t) => t.done).length : tasks.filter((t) => t.label === activeFilter && t.done).length;
  const pct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;

  document.getElementById("progressPercent").textContent = `${pct}%`;
  document.getElementById("progressFill").style.width = `${pct}%`;
  document.getElementById("progressCount").textContent = `${doneAll} of ${totalAll} done`;

  const headline = document.getElementById("progressHeadline");
  if (totalAll === 0) {
    headline.textContent = "No tasks yet.";
  } else if (doneAll === 0) {
    headline.textContent = "Nothing done yet. The needle's waiting.";
  } else if (doneAll === totalAll) {
    headline.textContent = "All done. Backlog clear.";
  } else {
    headline.textContent = "Chipping away at it.";
  }
}

// ---------- Yearly goals (separate from client backlog) ----------
const YEARLY_STORAGE_KEY = "taskBacklog.yearlyGoals";
let yearlyGoals = [];

const yearlyForm = document.getElementById("yearlyForm");
const yearlyInput = document.getElementById("yearlyInput");
const yearlyList = document.getElementById("yearlyList");
const yearlyEmpty = document.getElementById("yearlyEmpty");

function loadYearlyGoals() {
  try {
    const raw = localStorage.getItem(YEARLY_STORAGE_KEY);
    yearlyGoals = raw ? JSON.parse(raw) : [];
  } catch (e) {
    yearlyGoals = [];
  }
}

function saveYearlyGoals() {
  localStorage.setItem(YEARLY_STORAGE_KEY, JSON.stringify(yearlyGoals));
}

function makeYearlyRow(goal) {
  const row = document.createElement("div");
  row.className = "task-row" + (goal.done ? " done" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = goal.done;
  checkbox.addEventListener("change", () => {
    goal.done = !goal.done;
    if (goal.done) goal.doneAt = Date.now();
    saveYearlyGoals();
    renderYearly();
  });

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = goal.text;

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete-btn";
  del.innerHTML = "&#10005;";
  del.title = "Delete goal";
  del.addEventListener("click", () => {
    yearlyGoals = yearlyGoals.filter((g) => g.id !== goal.id);
    saveYearlyGoals();
    renderYearly();
  });

  row.appendChild(checkbox);
  row.appendChild(text);
  row.appendChild(del);
  return row;
}

function renderYearly() {
  const sorted = [...yearlyGoals].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  yearlyList.innerHTML = "";
  sorted.forEach((g) => yearlyList.appendChild(makeYearlyRow(g)));
  yearlyEmpty.style.display = sorted.length ? "none" : "block";

  const total = yearlyGoals.length;
  const done = yearlyGoals.filter((g) => g.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("yearlyProgressCount").textContent = `${done} of ${total} done`;
  document.getElementById("yearlyProgressFill").style.width = `${pct}%`;
}

yearlyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = yearlyInput.value.trim();
  if (!text) return;

  yearlyGoals.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text,
    done: false,
    createdAt: Date.now(),
  });

  yearlyInput.value = "";
  saveYearlyGoals();
  renderYearly();
  yearlyInput.focus();
});

// ---------- Init ----------
loadTasks();
render();
loadYearlyGoals();
renderYearly();
