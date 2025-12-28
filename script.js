const STORAGE_KEYS = {
  tasks: "mwd_tasks",
  goals: "mwd_goals",
  focus: "mwd_focus_logs",
  theme: "mwd_theme"
};

let state = {
  tasks: [],
  goals: [],
  focusLogs: [],
  theme: "dark"
};

let tasksChart;
let focusChart;

let timerInterval;
let currentSession = {
  type: "Focus",
  focusMinutes: 25,
  breakMinutes: 5,
  remainingSeconds: 25 * 60,
  running: false
};

let editingTaskId = null;

const qs = (sel) => document.querySelector(sel);
const todayKey = () => new Date().toISOString().slice(0, 10);

function loadState() {
  state.tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || "[]");
  state.goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.goals) || "[]");
  state.focusLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.focus) || "[]");
  state.theme = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals));
  localStorage.setItem(STORAGE_KEYS.focus, JSON.stringify(state.focusLogs));
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
}

function setTheme(theme) {
  state.theme = theme;
  if (theme === "light") {
    document.body.setAttribute("data-theme", "light");
  } else {
    document.body.removeAttribute("data-theme");
  }
  qs("#themeToggle").checked = theme === "light";
  saveState();
}

function renderDate() {
  const dateEl = qs("#todayDate");
  const timeEl = qs("#currentTime");
  const now = new Date();
  const options = { weekday: "long", month: "short", day: "numeric" };
  dateEl.textContent = now.toLocaleDateString(undefined, options);
  
  // Update time with AM/PM
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = hours.toString().padStart(2, '0');
  timeEl.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

function startClock() {
  renderDate();
  setInterval(renderDate, 1000);
}

function renderHeroMetrics() {
  const container = qs("#heroMetrics");
  const done = state.tasks.filter((t) => t.status === "Done").length;
  const total = state.tasks.length;
  const focusMins = sumFocusForRange(7);
  const goals = state.goals.length;
  const snippets = [
    { label: "Tasks done", value: `${done}/${total || 0}` },
    { label: "Focus mins (7d)", value: focusMins },
    { label: "Weekly goals", value: goals }
  ];
  container.innerHTML = snippets
    .map(
      (s) => `
      <div class="metric-pill">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>`
    )
    .join("");
}

function renderTasks() {
  const list = qs("#taskList");
  if (!state.tasks.length) {
    list.innerHTML = "<p class='muted'>No tasks yet. Add one to start the day.</p>";
    return;
  }
  list.innerHTML = state.tasks
    .map((task) => {
      const priorityClass = task.priority.toLowerCase();
      const due = task.dueTime ? `<span class="badge">Due ${task.dueTime}</span>` : "";
      const status = task.status;
      return `
      <div class="task-item" data-id="${task.id}">
        <div>
          <strong>${task.title}</strong>
          <div class="task-meta">
            <span class="badge">${task.category}</span>
            <span class="badge ${priorityClass}">${task.priority}</span>
            <span class="badge">${status}</span>
            ${due}
          </div>
        </div>
        <div class="task-actions">
          <select class="task-status">
            <option value="Todo" ${status === "Todo" ? "selected" : ""}>Todo</option>
            <option value="In Progress" ${status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Done" ${status === "Done" ? "selected" : ""}>Done</option>
          </select>
          <button class="ghost edit-task">Edit</button>
          <button class="ghost delete-task">Delete</button>
        </div>
      </div>`;
    })
    .join("");
}

function addTask(data) {
  const task = {
    id: crypto.randomUUID(),
    title: data.title,
    category: data.category,
    priority: data.priority,
    status: data.status,
    dueTime: data.dueTime || "",
    createdDate: todayKey(),
    completedDate: data.status === "Done" ? todayKey() : null
  };
  state.tasks.unshift(task);
  saveState();
  renderTasks();
  updateStats();
  updateCharts();
}

function updateTask(id, updates) {
  state.tasks = state.tasks.map((t) => {
    if (t.id === id) {
      const next = { ...t, ...updates };
      if (next.status === "Done") {
        next.completedDate = todayKey();
      } else {
        next.completedDate = null;
      }
      return next;
    }
    return t;
  });
  saveState();
  renderTasks();
  updateStats();
  updateCharts();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveState();
  renderTasks();
  updateStats();
  updateCharts();
}

function clearDoneTasks() {
  state.tasks = state.tasks.filter((t) => t.status !== "Done");
  saveState();
  renderTasks();
  updateStats();
  updateCharts();
}

function renderGoals() {
  const list = qs("#goalList");
  if (!state.goals.length) {
    list.innerHTML = "<p class='muted'>Define what a winning week looks like.</p>";
    return;
  }
  list.innerHTML = state.goals
    .map((goal) => {
      const total = goal.subtasks.length || 1;
      const done = goal.subtasks.filter((s) => s.done).length;
      const pct = Math.round((done / total) * 100);
      const subtasks = goal.subtasks
        .map(
          (s) => `
          <div class="subtask" data-goal="${goal.id}" data-sub="${s.id}">
            <input type="checkbox" ${s.done ? "checked" : ""} class="toggle-sub">
            <span>${s.text}</span>
            <button class="ghost delete-sub">x</button>
          </div>`
        )
        .join("");
      return `
      <div class="goal-card" data-id="${goal.id}">
        <div class="goal-header">
          <strong>${goal.title}</strong>
          <button class="ghost delete-goal">Delete</button>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <div class="muted">${done}/${total} subtasks done (${pct}%)</div>
        <div class="subtasks">${subtasks || "<span class='muted'>Add subtasks</span>"}</div>
        <div class="inline-form" data-goal-form>
          <input type="text" placeholder="Add sub-task" class="subtask-input" />
          <button type="button" class="ghost add-subtask">Add</button>
        </div>
      </div>`;
    })
    .join("");
}

function addGoal(title) {
  state.goals.unshift({ id: crypto.randomUUID(), title, subtasks: [] });
  saveState();
  renderGoals();
  updateStats();
}

function deleteGoal(id) {
  state.goals = state.goals.filter((g) => g.id !== id);
  saveState();
  renderGoals();
  updateStats();
}

function addSubtask(goalId, text) {
  state.goals = state.goals.map((g) =>
    g.id === goalId ? { ...g, subtasks: [...g.subtasks, { id: crypto.randomUUID(), text, done: false }] } : g
  );
  saveState();
  renderGoals();
  updateStats();
}

function toggleSubtask(goalId, subId) {
  state.goals = state.goals.map((g) => {
    if (g.id !== goalId) return g;
    return {
      ...g,
      subtasks: g.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s))
    };
  });
  saveState();
  renderGoals();
  updateStats();
}

function deleteSubtask(goalId, subId) {
  state.goals = state.goals.map((g) => {
    if (g.id !== goalId) return g;
    return { ...g, subtasks: g.subtasks.filter((s) => s.id !== subId) };
  });
  saveState();
  renderGoals();
  updateStats();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function renderTimer() {
  qs("#timerDisplay").textContent = formatTime(currentSession.remainingSeconds);
  qs("#sessionType").textContent = currentSession.type;
  const base = currentSession.type === "Focus" ? currentSession.focusMinutes * 60 : currentSession.breakMinutes * 60;
  const progress = 360 - (currentSession.remainingSeconds / base) * 360;
  qs("#progressRing").style.setProperty("--progress", `${progress}deg`);
  qs("#startPause").textContent = currentSession.running ? "Pause" : "Start";
}

function logFocusSession(minutes) {
  state.focusLogs.push({ date: todayKey(), minutes, type: "Focus" });
  saveState();
  updateCharts();
  updateStats();
}

function switchSession(nextType) {
  currentSession.type = nextType;
  currentSession.remainingSeconds = nextType === "Focus" ? currentSession.focusMinutes * 60 : currentSession.breakMinutes * 60;
  renderTimer();
}

function tick() {
  if (!currentSession.running) return;
  currentSession.remainingSeconds -= 1;
  if (currentSession.remainingSeconds <= 0) {
    currentSession.running = false;
    clearInterval(timerInterval);
    if (currentSession.type === "Focus") {
      logFocusSession(currentSession.focusMinutes);
      alert(`🎉 Focus session complete! You focused for ${currentSession.focusMinutes} minutes.`);
      switchSession("Break");
    } else {
      alert("✨ Break complete! Ready for another focus session?");
      switchSession("Focus");
    }
  }
  renderTimer();
}

function startTimer() {
  if (currentSession.running) {
    currentSession.running = false;
    clearInterval(timerInterval);
  } else {
    currentSession.running = true;
    timerInterval = setInterval(tick, 1000);
  }
  renderTimer();
}

function resetTimer() {
  currentSession.running = false;
  clearInterval(timerInterval);
  currentSession.remainingSeconds = currentSession.focusMinutes * 60;
  currentSession.type = "Focus";
  renderTimer();
}

function stopTimer() {
  if (!currentSession.running) return;
  
  currentSession.running = false;
  clearInterval(timerInterval);
  
  // Log partial focus time if in focus mode
  if (currentSession.type === "Focus") {
    const totalSeconds = currentSession.focusMinutes * 60;
    const elapsedSeconds = totalSeconds - currentSession.remainingSeconds;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    
    if (elapsedMinutes > 0) {
      logFocusSession(elapsedMinutes);
      alert(`⏸️ Focus session stopped. Logged ${elapsedMinutes} minutes.`);
    }
  }
  
  // Reset timer
  currentSession.remainingSeconds = currentSession.focusMinutes * 60;
  currentSession.type = "Focus";
  renderTimer();
}

function bindTimerControls() {
  qs("#startPause").addEventListener("click", startTimer);
  qs("#stopTimer").addEventListener("click", stopTimer);
  qs("#resetTimer").addEventListener("click", resetTimer);
  document.querySelectorAll(".timer-presets button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSession.focusMinutes = Number(btn.dataset.focus);
      currentSession.breakMinutes = Number(btn.dataset.break);
      resetTimer();
    });
  });
}

function renderNotes(dateKey) {
  // notes removed
}

function saveNote(dateKey) {
  // notes removed
}

function buildLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getTasksCompletedPerDay() {
  const days = buildLast7Days();
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return state.tasks.filter((t) => t.completedDate === key).length;
  });
}

function getFocusMinutesPerDay() {
  const days = buildLast7Days();
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return state.focusLogs
      .filter((f) => f.date === key)
      .reduce((sum, f) => sum + Number(f.minutes || 0), 0);
  });
}

function sumFocusForRange(daysBack = 7) {
  const days = [];
  for (let i = daysBack - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days.reduce((total, d) => {
    const key = d.toISOString().slice(0, 10);
    return (
      total +
      state.focusLogs
        .filter((f) => f.date === key)
        .reduce((sum, f) => sum + Number(f.minutes || 0), 0)
    );
  }, 0);
}

function updateCharts() {
  const ctxTasks = document.getElementById("tasksChart").getContext("2d");
  const ctxFocus = document.getElementById("focusChart").getContext("2d");
  const labels = buildLast7Days().map((d) => d.toLocaleDateString(undefined, { weekday: "short" }));

  const taskData = getTasksCompletedPerDay();
  const focusData = getFocusMinutesPerDay();

  if (tasksChart) tasksChart.destroy();
  if (focusChart) focusChart.destroy();

  tasksChart = new Chart(ctxTasks, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Tasks Done",
          data: taskData,
          backgroundColor: "rgba(56, 209, 196, 0.5)",
          borderColor: "rgba(56, 209, 196, 1)",
          borderRadius: 6
        }
      ]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  focusChart = new Chart(ctxFocus, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Focus minutes",
          data: focusData,
          borderColor: "rgba(122, 216, 255, 1)",
          backgroundColor: "rgba(122, 216, 255, 0.2)",
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

function updateStats() {
  const today = todayKey();
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.status === "Done").length;
  const inProgress = state.tasks.filter((t) => t.status === "In Progress").length;
  const focusToday = state.focusLogs
    .filter((f) => f.date === today)
    .reduce((sum, f) => sum + Number(f.minutes || 0), 0);

  const summary = [
    { label: "Tasks", value: total },
    { label: "Completed", value: done },
    { label: "In progress", value: inProgress },
    { label: "Focus mins today", value: focusToday }
  ];
  qs("#todaySummary").innerHTML = summary
    .map((s) => `
      <div class="stat">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>`)
    .join("");

  const quick = [
    { label: "Goals", value: state.goals.length },
    { label: "Subtasks done", value: state.goals.reduce((sum, g) => sum + g.subtasks.filter((s) => s.done).length, 0) },
    { label: "7d focus mins", value: sumFocusForRange(7) },
    { label: "Done this week", value: getTasksCompletedPerDay().reduce((a, b) => a + b, 0) }
  ];
  qs("#quickStats").innerHTML = quick
    .map((s) => `
      <div class="stat">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>`)
    .join("");

  renderHeroMetrics();
}

function renderCalendar() {
  const container = qs("#miniCalendar");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells = [];
  dayNames.forEach((d) => cells.push(`<div class="day-name">${d}</div>`));
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(`<div></div>`);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday = day === now.getDate();
    cells.push(`<div class="day ${isToday ? "today" : ""}">${day}</div>`);
  }
  container.innerHTML = cells.join("");
}

function bindTaskForm() {
  const form = qs("#taskForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      title: qs("#taskTitle").value.trim(),
      category: qs("#taskCategory").value,
      priority: qs("#taskPriority").value,
      status: qs("#taskStatus").value,
      dueTime: qs("#taskDue").value
    };
    if (!data.title) return;
    if (editingTaskId) {
      updateTask(editingTaskId, data);
    } else {
      addTask(data);
    }
    form.reset();
    qs("#taskPriority").value = "Medium";
    qs("#taskStatus").value = "Todo";
    editingTaskId = null;
    form.querySelector("button[type='submit']").textContent = "Add";
  });

  qs("#clearTasks").addEventListener("click", clearDoneTasks);

  qs("#taskList").addEventListener("change", (e) => {
    if (e.target.classList.contains("task-status")) {
      const id = e.target.closest(".task-item").dataset.id;
      updateTask(id, { status: e.target.value });
    }
  });

  qs("#taskList").addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-task")) {
      const id = e.target.closest(".task-item").dataset.id;
      deleteTask(id);
    }
    if (e.target.classList.contains("edit-task")) {
      const id = e.target.closest(".task-item").dataset.id;
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      qs("#taskTitle").value = task.title;
      qs("#taskCategory").value = task.category;
      qs("#taskPriority").value = task.priority;
      qs("#taskStatus").value = task.status;
      qs("#taskDue").value = task.dueTime;
      editingTaskId = id;
      form.querySelector("button[type='submit']").textContent = "Save";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

function bindGoalForm() {
  const form = qs("#goalForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = qs("#goalTitle").value.trim();
    if (!title) return;
    addGoal(title);
    form.reset();
  });

  qs("#goalList").addEventListener("click", (e) => {
    const goalCard = e.target.closest(".goal-card");
    if (!goalCard) return;
    const goalId = goalCard.dataset.id;
    if (e.target.classList.contains("delete-goal")) {
      deleteGoal(goalId);
    }
    if (e.target.classList.contains("add-subtask")) {
      const input = goalCard.querySelector(".subtask-input");
      const text = input.value.trim();
      if (!text) return;
      addSubtask(goalId, text);
      input.value = "";
    }
    if (e.target.classList.contains("delete-sub")) {
      const subId = e.target.closest(".subtask").dataset.sub;
      deleteSubtask(goalId, subId);
    }
  });

  qs("#goalList").addEventListener("change", (e) => {
    if (e.target.classList.contains("toggle-sub")) {
      const subId = e.target.closest(".subtask").dataset.sub;
      const goalId = e.target.closest(".goal-card").dataset.id;
      toggleSubtask(goalId, subId);
    }
  });
}

function bindNotes() {
  // notes removed
}

function bindTheme() {
  qs("#themeToggle").addEventListener("change", (e) => {
    setTheme(e.target.checked ? "light" : "dark");
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
      e.target.classList.add("active");
      
      // Scroll to target section
      const targetId = e.target.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      
      closeSidebar();
    });
  });
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector("#sidebarOverlay");
  sidebar.classList.remove("open");
  overlay.classList.remove("visible");
}

function bindSidebarToggle() {
  const toggle = document.querySelector("#menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector("#sidebarOverlay");
  toggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");
    sidebar.classList.toggle("open", !isOpen);
    overlay.classList.toggle("visible", !isOpen);
  });
  overlay.addEventListener("click", closeSidebar);
}

function init() {
  loadState();
  setTheme(state.theme);
  startClock();
  renderHeroMetrics();
  renderTasks();
  renderGoals();
  renderCalendar();
  renderTimer();
  updateStats();
  updateCharts();
  bindTaskForm();
  bindGoalForm();
  bindTimerControls();
  bindTheme();
  bindNavigation();
  bindSidebarToggle();
}

init();
