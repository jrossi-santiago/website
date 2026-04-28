/* ============================================================
   ANALOG — script.js
   ============================================================ */

// --- YOUR SUPABASE CREDENTIALS ---
const SUPABASE_URL      = 'https://rvwyjipseusvqjqbwken.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3lqaXBzZXVzdnFqcWJ3a2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4MDAsImV4cCI6MjA5MjAxNjgwMH0.UFYPZndWuY3uDOWovjxa7qreidWM9sacUlIS9iteMXc';

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- APP STATE ---
let todayCard    = null;
let somedayItems = [];
let futureItems  = [];

/* ============================================================
   RECURRING TASK DEFINITIONS
   ============================================================ */

// Tasks that appear every weekday (Mon–Fri)
const DAILY_TASKS = [
  { text: 'Check Instantly',                      url: 'https://app.instantly.ai' },
  { text: 'Check Fillout',                        url: 'https://fillout.com' },
  { text: 'Check LinkedIn notifications',         url: 'https://linkedin.com' },
  { text: 'Comment on 5 posts (LinkedIn skill)',  url: 'https://linkedin.com' },
];

// Extra tasks added on top of daily tasks for each weekday
const EXTRA_TASKS = {
  1: [ // Monday
    { text: 'Add leads to Instantly' },
    { text: 'Review and update Instantly campaigns' },
    { text: 'Schedule this week\'s LinkedIn posts' },
    { text: 'Connect with 1 referral' },
  ],
  2: [ // Tuesday
    { text: 'Connect with 1 referral' },
    { text: 'Build lead magnets' },
  ],
  3: [ // Wednesday
    { text: 'Connect with 1 referral' },
    { text: 'SEO article (SEO skill)' },
    { text: 'Work on the business — systems, methods & new ideas' },
  ],
  4: [ // Thursday
    { text: 'Connect with 1 referral' },
    { text: 'Reach out to expanded LinkedIn network' },
    { text: 'Invite personal connections to follow business page' },
  ],
  5: [ // Friday
    { text: 'Connect with 1 referral' },
    { text: 'Review analytics' },
    { text: 'Come up with plan for next week' },
    { text: 'Log report on successes and failings of this week' },
  ],
};

const WHY_BUILDINGS_TASKS = [
  { text: 'Post on Twitter' },
  { text: 'Comment on 15 posts' },
  { text: 'Reply to everything (likes, comments, follows)' },
];

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/* ============================================================
   DATE HELPERS
   ============================================================ */

function getLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${m}.${d}.${y.slice(2)}`;
}

function makeFreshTasks(prefill = []) {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    text: prefill[i] ? prefill[i].text : '',
    completed: false,
  }));
}

/* ============================================================
   INITIALIZATION
   ============================================================ */

async function init() {
  try {
    renderTodayDate();
    renderBusinessSidebar();
    renderWhyBuildingsSidebar();
    await loadTodayCard();
    await loadBacklogItems();
    await updateStreak();
    await renderContributionGrid();
    setupEventListeners();
    scheduleMidnightReload();
  } catch (err) {
    console.error('Init error:', err);
  } finally {
    hideLoading();
  }
}

function renderTodayDate() {
  document.getElementById('today-date').textContent = formatDateDisplay(getLocalDate());
}

/* ============================================================
   BUSINESS SIDEBAR — Day-aware recurring tasks
   ============================================================ */

function renderBusinessSidebar() {
  const container = document.getElementById('business-card-inner');
  const dayIndex  = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const dayName   = DAY_NAMES[dayIndex];
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  if (isWeekend) {
    container.innerHTML = `
      <div class="sidebar-card-header">
        <span class="sidebar-day-label">${dayName}</span>
        <span class="sidebar-section-label">Business</span>
      </div>
      <div class="sidebar-rest">
        <span class="sidebar-rest-title">Rest &amp; reflect.</span>
        <p class="sidebar-rest-body">Weekdays are for business. Today is for recharging so you can show up fully on Monday.</p>
      </div>
    `;
    return;
  }

  // Build daily tasks rows
  const dailyRows = DAILY_TASKS.map((t, i) => buildSidebarRow(t, `biz-daily-${i}`)).join('');

  // Build extra tasks for today
  const extras     = EXTRA_TASKS[dayIndex] || [];
  const extraRows  = extras.map((t, i) => buildSidebarRow(t, `biz-extra-${i}`)).join('');
  const extraGroup = extras.length ? `
    <div class="sidebar-task-group">
      <span class="sidebar-group-label">Also today</span>
      ${extraRows}
    </div>
  ` : '';

  container.innerHTML = `
    <div class="sidebar-card-header">
      <span class="sidebar-day-label">${dayName}</span>
      <span class="sidebar-section-label">Business</span>
    </div>
    <div class="sidebar-task-group">
      <span class="sidebar-group-label">Every day</span>
      ${dailyRows}
    </div>
    ${extraGroup}
  `;

  // Wire up circle toggles
  container.querySelectorAll('.sidebar-circle-btn').forEach(btn => {
    btn.addEventListener('click', onSidebarToggle);
  });
}

/* ============================================================
   WHY BUILDINGS SIDEBAR — Same every day
   ============================================================ */

function renderWhyBuildingsSidebar() {
  const container = document.getElementById('wb-card-inner');
  const rows = WHY_BUILDINGS_TASKS.map((t, i) => buildSidebarRow(t, `wb-${i}`)).join('');

  container.innerHTML = `
    <div class="sidebar-card-header">
      <span class="sidebar-day-label">Why Buildings</span>
      <span class="sidebar-section-label">Daily</span>
    </div>
    <div class="sidebar-task-group">
      ${rows}
    </div>
  `;

  container.querySelectorAll('.sidebar-circle-btn').forEach(btn => {
    btn.addEventListener('click', onSidebarToggle);
  });
}

/* ============================================================
   SIDEBAR HELPERS
   ============================================================ */

// Builds one sidebar task row with a circle toggle and optional hyperlink
function buildSidebarRow(task, id) {
  const label = task.url
    ? `<a href="${task.url}" target="_blank" rel="noopener noreferrer">${escHtml(task.text)}</a>`
    : escHtml(task.text);

  return `
    <div class="sidebar-task-row">
      <button class="sidebar-circle-btn" data-sid="${id}" aria-label="Toggle ${escHtml(task.text)}">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.25"/>
          <circle class="sidebar-circle-inner" cx="8" cy="8" r="4.5" fill="currentColor"/>
        </svg>
      </button>
      <span class="sidebar-task-text" data-sid="${id}">${label}</span>
    </div>
  `;
}

// Visual-only toggle — no database, resets on reload
function onSidebarToggle(e) {
  const btn     = e.currentTarget;
  const sid     = btn.dataset.sid;
  const isNow   = btn.classList.toggle('checked');
  const inner   = btn.querySelector('.sidebar-circle-inner');
  inner.style.transform = isNow ? 'scale(1)' : 'scale(0)';

  const textEl = document.querySelector(`.sidebar-task-text[data-sid="${sid}"]`);
  if (textEl) textEl.classList.toggle('checked-text', isNow);
}

/* ============================================================
   CONTRIBUTION GRID
   ============================================================ */

async function renderContributionGrid() {
  const grid    = document.getElementById('contribution-grid');
  const today   = getLocalDate();
  const todayDt = new Date(today + 'T00:00:00');

  // Fetch all archived cards (not today's, which may be in progress)
  const { data } = await db
    .from('today_cards')
    .select('date, tasks')
    .order('date', { ascending: true });

  // Build a map of date → score-tier for quick lookup
  // score-tier: "missed" | "s1" | "s2" | "s3" | "s4" | "s5"
  const scoreMap = {};
  if (data) {
    data.forEach(card => {
      const filled    = (card.tasks || []).filter(t => t.text);
      const completed = filled.filter(t => t.completed).length;
      const total     = filled.length;

      if (card.date === today) return; // today handled separately

      if (total === 0) {
        scoreMap[card.date] = 'missed';
      } else {
        const pct = completed / total;
        if (pct === 0)        scoreMap[card.date] = 'missed';
        else if (pct <= 0.25) scoreMap[card.date] = 's1';
        else if (pct <= 0.50) scoreMap[card.date] = 's2';
        else if (pct <= 0.75) scoreMap[card.date] = 's3';
        else if (pct < 1)     scoreMap[card.date] = 's4';
        else                   scoreMap[card.date] = 's5';
      }
    });
  }

  // Grid spans exactly 12 weeks = 84 days, starting from today
  // We fill forward in time, left-to-right, Mon-Sun columns
  // Find the Monday on or before today to start the grid cleanly
  const startDt = new Date(todayDt);
  // dayOfWeek: Mon=0 ... Sun=6 (we want weeks to start Monday)
  const dow = (todayDt.getDay() + 6) % 7; // convert Sun=0 to Mon=0
  startDt.setDate(startDt.getDate() - dow);

  // Build 12 weeks of cells
  grid.innerHTML = '';

  for (let week = 0; week < 12; week++) {
    const weekEl = document.createElement('div');
    weekEl.className = 'contrib-week';

    for (let day = 0; day < 7; day++) {
      const cellDt  = new Date(startDt);
      cellDt.setDate(startDt.getDate() + (week * 7) + day);
      const cellStr = `${cellDt.getFullYear()}-${String(cellDt.getMonth()+1).padStart(2,'0')}-${String(cellDt.getDate()).padStart(2,'0')}`;

      const cell = document.createElement('div');
      cell.className = 'contrib-cell';

      // Determine what to show
      if (cellStr === today) {
        cell.dataset.score = 'today';
        cell.title = 'Today';
      } else if (cellDt > todayDt) {
        cell.dataset.score = 'future';
        cell.title = formatDateDisplay(cellStr);
      } else if (scoreMap[cellStr]) {
        cell.dataset.score = scoreMap[cellStr];
        cell.title = `${formatDateDisplay(cellStr)} — ${labelFromScore(scoreMap[cellStr])}`;
      } else {
        // Past day with no card logged
        cell.dataset.score = 'missed';
        cell.title = `${formatDateDisplay(cellStr)} — no card`;
      }

      weekEl.appendChild(cell);
    }

    grid.appendChild(weekEl);
  }
}

function labelFromScore(score) {
  const map = {
    missed: 'No tasks completed',
    s1: '1–25% complete',
    s2: '26–50% complete',
    s3: '51–75% complete',
    s4: '76–99% complete',
    s5: 'Perfect day',
  };
  return map[score] || '';
}

/* ============================================================
   TODAY CARD
   ============================================================ */

async function loadTodayCard() {
  const today = getLocalDate();

  const { data } = await db
    .from('today_cards')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (data) {
    todayCard = data;
    renderTasks(data.tasks);
  } else {
    await checkYesterdayAndPrompt();
  }
}

async function checkYesterdayAndPrompt() {
  const yesterday = getYesterdayDate();
  const { data }  = await db
    .from('today_cards')
    .select('*')
    .eq('date', yesterday)
    .maybeSingle();

  if (data) {
    const incomplete = (data.tasks || []).filter(t => t.text && !t.completed);
    if (incomplete.length > 0) {
      showRolloverModal(incomplete);
      return;
    }
  }

  await createTodayCard([]);
}

async function createTodayCard(prefillTasks) {
  const today = getLocalDate();
  const tasks = makeFreshTasks(prefillTasks);

  const { data, error } = await db
    .from('today_cards')
    .insert({ date: today, tasks })
    .select()
    .single();

  if (error) {
    const { data: existing } = await db
      .from('today_cards')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    if (existing) {
      todayCard = existing;
      renderTasks(existing.tasks);
    }
    return;
  }

  todayCard = data;
  renderTasks(data.tasks);
}

/* ============================================================
   RENDER TASKS
   ============================================================ */

function renderTasks(tasks) {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  (tasks || []).forEach((task, i) => {
    const isCompleted = task.completed;
    const row = document.createElement('div');
    row.className = 'task-row';
    row.innerHTML = `
      <button class="task-circle${isCompleted ? ' completed' : ''}" data-index="${i}" aria-label="Toggle task ${i+1}">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
          <circle class="circle-inner" cx="10" cy="10" r="6" fill="currentColor"
            style="transform: scale(${isCompleted ? '1' : '0'});"/>
        </svg>
      </button>
      <input
        class="task-input${isCompleted ? ' completed' : ''}"
        type="text"
        value="${escHtml(task.text)}"
        placeholder="—"
        data-index="${i}"
        maxlength="80"
        aria-label="Task ${i+1}"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
      >
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.task-circle').forEach(btn => {
    btn.addEventListener('click', onToggleTask);
  });

  list.querySelectorAll('.task-input').forEach(input => {
    input.addEventListener('input', debounce(onTaskInput, 800));
  });
}

/* ============================================================
   TASK INTERACTIONS
   ============================================================ */

async function onToggleTask(e) {
  const btn   = e.currentTarget;
  const index = parseInt(btn.dataset.index);
  const task  = todayCard.tasks[index];
  if (!task.text.trim()) return;

  task.completed = !task.completed;
  btn.classList.toggle('completed', task.completed);
  btn.querySelector('.circle-inner').style.transform = task.completed ? 'scale(1)' : 'scale(0)';

  const input = document.querySelector(`.task-input[data-index="${index}"]`);
  if (input) input.classList.toggle('completed', task.completed);

  await saveToday();
  await updateStreak();
  await renderContributionGrid();
}

async function onTaskInput(e) {
  const index = parseInt(e.target.dataset.index);
  if (!todayCard) return;
  todayCard.tasks[index].text = e.target.value;
  await saveToday();
}

async function saveToday() {
  if (!todayCard) return;
  const { error } = await db
    .from('today_cards')
    .update({ tasks: todayCard.tasks })
    .eq('id', todayCard.id);
  if (error) console.error('Save error:', error);
}

/* ============================================================
   ROLLOVER MODAL
   ============================================================ */

function showRolloverModal(incompleteTasks) {
  const count = incompleteTasks.length;
  document.getElementById('rollover-count').textContent = count;
  document.getElementById('rollover-plural').textContent = count === 1 ? '' : 's';
  document.getElementById('rollover-modal').classList.remove('hidden');

  document.getElementById('rollover-yes').onclick = async () => {
    document.getElementById('rollover-modal').classList.add('hidden');
    await createTodayCard(incompleteTasks);
  };

  document.getElementById('rollover-no').onclick = async () => {
    document.getElementById('rollover-modal').classList.add('hidden');
    await createTodayCard([]);
  };
}

/* ============================================================
   BACKLOG — Someday + Future
   ============================================================ */

async function loadBacklogItems() {
  const { data } = await db
    .from('backlog_items')
    .select('*')
    .eq('is_done', false)
    .order('created_at', { ascending: true });

  if (data) {
    somedayItems = data.filter(i => i.type === 'someday');
    futureItems  = data.filter(i => i.type === 'future');
    renderBacklog('someday');
    renderBacklog('future');
  }
}

function renderBacklog(type) {
  const items   = type === 'someday' ? somedayItems : futureItems;
  const list    = document.getElementById(`${type}-list`);
  const countEl = document.getElementById(`${type}-count`);

  countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
  list.innerHTML = '';

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'backlog-row';
    row.innerHTML = `
      <button class="backlog-circle" data-id="${item.id}" data-type="${type}" aria-label="Mark done">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.25"/>
        </svg>
      </button>
      <span class="backlog-text">${escHtml(item.text)}</span>
      <button class="backlog-delete" data-id="${item.id}" data-type="${type}" aria-label="Delete">×</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.backlog-circle').forEach(btn => btn.addEventListener('click', onMarkBacklogDone));
  list.querySelectorAll('.backlog-delete').forEach(btn => btn.addEventListener('click', onDeleteBacklogItem));
}

async function addBacklogItem(type) {
  const input = document.getElementById(`${type}-input`);
  const text  = input.value.trim();
  if (!text) return;

  const { data, error } = await db
    .from('backlog_items')
    .insert({ type, text, is_done: false })
    .select()
    .single();

  if (error) { console.error('Add backlog error:', error); return; }

  if (type === 'someday') somedayItems.push(data);
  else futureItems.push(data);

  renderBacklog(type);
  input.value = '';
  input.focus();
}

async function onMarkBacklogDone(e) {
  const id   = e.currentTarget.dataset.id;
  const type = e.currentTarget.dataset.type;
  await db.from('backlog_items').update({ is_done: true }).eq('id', id);
  if (type === 'someday') somedayItems = somedayItems.filter(i => i.id !== id);
  else futureItems = futureItems.filter(i => i.id !== id);
  renderBacklog(type);
}

async function onDeleteBacklogItem(e) {
  const id   = e.currentTarget.dataset.id;
  const type = e.currentTarget.dataset.type;
  await db.from('backlog_items').delete().eq('id', id);
  if (type === 'someday') somedayItems = somedayItems.filter(i => i.id !== id);
  else futureItems = futureItems.filter(i => i.id !== id);
  renderBacklog(type);
}

/* ============================================================
   ARCHIVE
   ============================================================ */

async function loadArchive() {
  const today = getLocalDate();
  const grid  = document.getElementById('archive-grid');
  grid.innerHTML = '<p class="empty-archive">Loading...</p>';

  const { data, error } = await db
    .from('today_cards')
    .select('*')
    .neq('date', today)
    .order('date', { ascending: false });

  if (error || !data || data.length === 0) {
    grid.innerHTML = '<p class="empty-archive">No past cards yet.</p>';
    return;
  }

  grid.innerHTML = '';

  data.forEach(card => {
    const allTasks  = card.tasks || [];
    const filled    = allTasks.filter(t => t.text);
    const completed = filled.filter(t => t.completed).length;
    const total     = filled.length;
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    const preview = filled.slice(0, 5).map(t => `
      <div class="archive-task${t.completed ? ' done' : ''}">
        <span class="archive-dot${t.completed ? ' filled' : ''}"></span>
        <span class="archive-task-text">${escHtml(t.text)}</span>
      </div>
    `).join('');

    const el = document.createElement('div');
    el.className = 'archive-card';
    el.innerHTML = `
      <div class="archive-card-header">
        <span class="archive-label">Today</span>
        <span class="archive-date">${formatDateDisplay(card.date)}</span>
      </div>
      <div class="archive-score">${completed}/${total} &nbsp;&middot;&nbsp; ${pct}%</div>
      <div class="archive-tasks">
        ${preview || '<span style="color:var(--text-light);font-size:10px;font-style:italic">Empty card</span>'}
      </div>
    `;

    el.addEventListener('click', () => openArchiveCardModal(card));
    grid.appendChild(el);
  });
}

function openArchiveCardModal(card) {
  const allTasks  = card.tasks || [];
  const filled    = allTasks.filter(t => t.text);
  const completed = filled.filter(t => t.completed).length;
  const total     = filled.length;

  const taskRows = allTasks.map(t => `
    <div class="archive-static-row${!t.text ? ' empty-row' : ''}">
      <span class="static-circle${t.completed ? ' completed' : ''}">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
          ${t.completed ? '<circle cx="10" cy="10" r="6" fill="currentColor"/>' : ''}
        </svg>
      </span>
      <span class="static-text${t.completed ? ' completed' : ''}${!t.text ? ' empty' : ''}">
        ${t.text ? escHtml(t.text) : '—'}
      </span>
    </div>
  `).join('');

  document.getElementById('modal-inner').innerHTML = `
    <div class="archive-full-card">
      <div class="archive-full-top">
        <span class="card-label">Today</span>
        <div class="card-top-right">
          <span class="card-date">${formatDateDisplay(card.date)}</span>
          <div class="card-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot dot-filled"></span>
          </div>
        </div>
      </div>
      <div class="archive-full-tasks">${taskRows}</div>
      <div class="archive-full-footer">${completed} of ${total} completed</div>
    </div>
  `;

  document.getElementById('card-modal').classList.remove('hidden');
}

/* ============================================================
   STREAK COUNTER
   ============================================================ */

async function updateStreak() {
  const { data } = await db
    .from('today_cards')
    .select('date, tasks')
    .order('date', { ascending: false })
    .limit(90);

  let streak = 0;

  if (data && data.length > 0) {
    const activeDates = new Set(
      data
        .filter(card => (card.tasks || []).some(t => t.text))
        .map(card => card.date)
    );

    let checkDate = new Date();
    for (let i = 0; i < 90; i++) {
      const y   = checkDate.getFullYear();
      const m   = String(checkDate.getMonth()+1).padStart(2,'0');
      const d   = String(checkDate.getDate()).padStart(2,'0');
      const str = `${y}-${m}-${d}`;

      if (activeDates.has(str)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  document.getElementById('streak-number').textContent = streak;
}

/* ============================================================
   MIDNIGHT RELOAD
   ============================================================ */

function scheduleMidnightReload() {
  const now      = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 10, 0);
  setTimeout(() => window.location.reload(), midnight - now);
}

/* ============================================================
   LOADING
   ============================================================ */

function hideLoading() {
  const overlay = document.getElementById('loading');
  overlay.classList.add('fade-out');
  setTimeout(() => overlay.classList.add('hidden'), 420);
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function setupEventListeners() {

  document.getElementById('archive-btn').addEventListener('click', () => {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('archive-view').classList.remove('hidden');
    loadArchive();
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('archive-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
  });

  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('card-modal').classList.add('hidden');
  });

  document.getElementById('card-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('card-modal')) {
      document.getElementById('card-modal').classList.add('hidden');
    }
  });

  ['someday', 'future'].forEach(type => {
    document.getElementById(`${type}-header`).addEventListener('click', () => {
      document.getElementById(`${type}-card`).classList.toggle('expanded');
    });

    document.getElementById(`${type}-add-btn`).addEventListener('click', (e) => {
      e.stopPropagation();
      addBacklogItem(type);
    });

    document.getElementById(`${type}-input`).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBacklogItem(type);
      e.stopPropagation();
    });

    document.getElementById(`${type}-input`).addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

/* ============================================================
   UTILITIES
   ============================================================ */

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================================
   START
   ============================================================ */

init();
