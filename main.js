const DAYS = ['Понеділок','Вівторок','Середа','Четвер','Пятниця','Субота','Неділя'];
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

// Get today's day index (Mon=0)
const todayRaw = new Date().getDay(); // 0=Sun
const todayIdx = todayRaw === 0 ? 6 : todayRaw - 1;

let selectedDay = todayIdx;

// tasks[0..6] = array of {id, text, done}
let tasks = JSON.parse(localStorage.getItem('wf_tasks') || 'null') || Array.from({length:7}, ()=>[]);

function save() { localStorage.setItem('wf_tasks', JSON.stringify(tasks)); }

function getDayStats(d) {
const t = tasks[d];
const total = t.length;
const done = t.filter(x=>x.done).length;
const pct = total ? Math.round(done/total*100) : 0;
return { total, done, pct };
}

function renderWeekOverview() {
const el = document.getElementById('weekOverview');
el.innerHTML = '';
DAYS.forEach((name, i) => {
    const {total, pct} = getDayStats(i);
    const div = document.createElement('div');
    div.className = 'week-mini' + (i===selectedDay?' active':'') + (i===todayIdx?' today':'');
    div.style.setProperty('--pct', pct/100);
    div.innerHTML = `
    <div class="day-abbr">${DAYS_SHORT[i]}</div>
    <div class="day-pct">${pct}%</div>
    <div class="day-task-count">${total} задач</div>
    `;
    div.onclick = () => selectDay(i);
    el.appendChild(div);
});
}

function renderTaskList() {
const el = document.getElementById('taskList');
const t = tasks[selectedDay];
document.getElementById('selectedDayTitle').textContent = DAYS[selectedDay];

if (t.length === 0) {
    el.innerHTML = `<div class="task-empty"><div class="empty-icon">📋</div><div>Задач ще немає<br><small>Додайте першу задачу нижче</small></div></div>`;
} else {
    el.innerHTML = t.map((task, i) => `
    <div class="task-item" id="task-${task.id}">
        <div class="task-checkbox ${task.done?'checked':''}" onclick="toggleTask(${i})"></div>
        <span class="task-text ${task.done?'done':''}">${escHtml(task.text)}</span>
        <button class="task-delete" onclick="deleteTask(${i})" title="Видалити">×</button>
    </div>
    `).join('');
}

updateRing();
}

function updateRing() {
const {pct} = getDayStats(selectedDay);
const circumference = 201;
  const offset = circumference - (circumference * pct / 100);
document.getElementById('ringFill').style.strokeDashoffset = offset;
document.getElementById('ringPct').textContent = pct + '%';
}

function renderStats() {
let total=0, done=0;
tasks.forEach(d => { total+=d.length; done+=d.filter(x=>x.done).length; });
const left = total - done;
const pct = total ? Math.round(done/total*100) : 0;
document.getElementById('statTotal').textContent = total;
document.getElementById('statDone').textContent = done;
document.getElementById('statLeft').textContent = left;
document.getElementById('statPct').textContent = pct + '%';

  // Bar chart
const bc = document.getElementById('barChart');
bc.innerHTML = '';
const maxTasks = Math.max(1, ...tasks.map(d=>d.length));
tasks.forEach((d, i) => {
    const {total:t, pct:p} = getDayStats(i);
    const heightPct = t ? Math.max(8, Math.round(t/maxTasks*100)) : 5;
    const wrap = document.createElement('div');
    wrap.className = 'bar-wrap';
    wrap.innerHTML = `
    <div class="bar-col">
        <div class="bar-fill ${i===selectedDay?'active':(t>0?'has-tasks':'')}" style="height:${heightPct}%;"></div>
    </div>
    <div class="bar-label">${DAYS_SHORT[i]}</div>
    `;
    wrap.onclick = () => selectDay(i);
    bc.appendChild(wrap);
});

  // Motivation
const el = document.getElementById('motivationBlock');
if (total === 0) {
    el.innerHTML = `<div class="emoji">🚀</div><p>Додайте перші задачі та почніть свій продуктивний тиждень!</p>`;
} else if (pct === 100) {
    el.innerHTML = `<div class="emoji">🏆</div><p><strong>Неймовірно!</strong> Всі задачі виконано. Ви — машина продуктивності!</p>`;
} else if (pct >= 70) {
    el.innerHTML = `<div class="emoji">🔥</div><p><strong>${pct}% виконано!</strong> Ви на фінальному відрізку — ще трохи і тиждень завершено!</p>`;
} else if (pct >= 40) {
    el.innerHTML = `<div class="emoji">⚡</div><p><strong>Гарний темп!</strong> ${done} задач виконано, ${left} ще попереду. Рухаєтесь у вірному напрямку.</p>`;
} else {
    el.innerHTML = `<div class="emoji">🌱</div><p>Ви маєте <strong>${total} задач</strong> цього тижня. Кожен крок вперед — це прогрес!</p>`;
}
}

function renderAll() {
renderWeekOverview();
renderTaskList();
renderStats();
}

function selectDay(i) {
selectedDay = i;
renderAll();
document.getElementById('taskInput').focus();
}

function addTask() {
const inp = document.getElementById('taskInput');
const text = inp.value.trim();
if (!text) return;
tasks[selectedDay].push({ id: Date.now(), text, done: false });
inp.value = '';
save();
renderAll();
}

function toggleTask(i) {
tasks[selectedDay][i].done = !tasks[selectedDay][i].done;
save();
renderAll();
}

function deleteTask(i) {
tasks[selectedDay].splice(i, 1);
save();
renderAll();
}

function escHtml(s) {
return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Enter key
document.addEventListener('DOMContentLoaded', () => {
document.getElementById('taskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
});

  // Current date
const d = new Date();
const opts = { weekday:'long', day:'numeric', month:'long' };
document.getElementById('currentDate').textContent = d.toLocaleDateString('uk-UA', opts);

renderAll();
});