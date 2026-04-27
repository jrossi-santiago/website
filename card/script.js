/* ============================================================
   ANALOG — script.js
   Digital Ugmonk Analog card system
   ============================================================ */

// --- YOUR SUPABASE CREDENTIALS ---
// Replace both values below with your own from supabase.com
// Settings → API → Project URL and anon public key
const SUPABASE_URL      = 'https://rvwyjipseusvqjqbwken.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2d3lqaXBzZXVzdnFqcWJ3a2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4MDAsImV4cCI6MjA5MjAxNjgwMH0.UFYPZndWuY3uDOWovjxa7qreidWM9sacUlIS9iteMXc';

// --- DATABASE CONNECTION ---
// createClient connects your app to your Supabase database
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- APP STATE ---
// These variables hold data while the app is running in memory
let todayCard     = null;  // The current today card object
let somedayItems  = [];    // Array of someday backlog items
let futureItems   = [];    // Array of future backlog items

/* ============================================================
   DATE HELPERS
   These functions figure out what "today" and "yesterday" are
   in a format the database understands: YYYY-MM-DD
   ============================================================ */

function getLocalDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Turns "2025-04-27" into "04.27.25" for display on the card
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${m}.${d}.${y.slice(2)}`;
}

// Builds a fresh array of 10 empty task slots
// If prefill tasks are passed in (rollover), they fill the first slots
function makeFreshTasks(prefill = []) {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    text: prefill[i] ? prefill[i].text : '',
    completed: false
  }));
}

/* ============================================================
   INITIALIZATION
   This runs when the page first loads
   ============================================================ */

async function init() {
  try {
    renderTodayDate();
    await loadTodayCard();
    await loadBacklogItems();
    await updateStreak();
    setupEventListeners();
    scheduleMidnightReload();
  } catch (err) {
    console.error('Error starting app:', err);
  } finally {
    // Always hide the loading screen, even if something went wrong
    hideLoading();
  }
}

function renderTodayDate() {
  document.getElementById('today-date').textContent = formatDateDisplay(getLocalDate());
}

/* ============================================================
   TODAY CARD — Load or create
   ============================================================ */

async function loadTodayCard() {
  const today = getLocalDate();

  // Look for a card with today's date in the database
  // maybeSingle() returns null (not an error) if nothing is found
  const { data, error } = await db
    .from('today_cards')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (data) {
    // A card for today already exists — load it
    todayCard = data;
    renderTasks(data.tasks);
  } else {
    // No card yet for today — check yesterday for incomplete tasks
    await checkYesterdayAndPrompt();
  }
}

async function checkYesterdayAndPrompt() {
  const yesterday = getYesterdayDate();

  const { data } = await db
    .from('today_cards')
    .select('*')
    .eq('date', yesterday)
    .maybeSingle();

  if (data) {
    // Filter for tasks that have text but weren't completed
    const incomplete = (data.tasks || []).filter(t => t.text && !t.completed);
    if (incomplete.length > 0) {
      // Show the "roll them over?" prompt
      showRolloverModal(incomplete);
      return;
    }
  }

  // No incomplete tasks from yesterday — start fresh
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
    // If insert failed, the card might already exist (rare timing issue)
    // Try loading it instead
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
   Builds the 10 task rows inside the Today card
   ============================================================ */

function renderTasks(tasks) {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  (tasks || []).forEach((task, i) => {
    const isCompleted = task.completed;
    const row = document.createElement('div');
    row.className = 'task-row';

    // Each row has a circle button + a text input
    // The circle-inner element is the filled dot that animates in/out
    row.innerHTML = `
      <button
        class="task-circle${isCompleted ? ' completed' : ''}"
        data-index="${i}"
        aria-label="Toggle task ${i + 1}"
      >
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
          <circle
            class="circle-inner"
            cx="10" cy="10" r="6"
            fill="currentColor"
            style="transform: scale(${isCompleted ? '1' : '0'});"
          />
        </svg>
      </button>
      <input
        class="task-input${isCompleted ? ' completed' : ''}"
        type="text"
        value="${escHtml(task.text)}"
        placeholder="—"
        data-index="${i}"
        maxlength="80"
        aria-label="Task ${i + 1}"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
      >
    `;

    list.appendChild(row);
  });

  // Attach events after all rows are in the DOM
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
  const btn = e.currentTarget;
  const index = parseInt(btn.dataset.index);
  const task = todayCard.tasks[index];

  // Don't allow toggling an empty task slot
  if (!task.text.trim()) return;

  // Flip the completed state
  task.completed = !task.completed;

  // Animate the circle fill
  btn.classList.toggle('completed', task.completed);
  const innerCircle = btn.querySelector('.circle-inner');
  innerCircle.style.transform = task.completed ? 'scale(1)' : 'scale(0)';

  // Strike through (or un-strike) the task text
  const input = document.querySelector(`.task-input[data-index="${index}"]`);
  if (input) input.classList.toggle('completed', task.completed);

  // Save to database and refresh streak
  await saveToday();
  await updateStreak();
}

// Called as you type in a task input (debounced so it doesn't save every keystroke)
async function onTaskInput(e) {
  const index = parseInt(e.target.dataset.index);
  if (!todayCard) return;
  todayCard.tasks[index].text = e.target.value;
  await saveToday();
}

// Writes the current state of todayCard.tasks to the database
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
   Shown when yesterday had incomplete tasks
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
   BACKLOG ITEMS — Someday + Future
   ============================================================ */

async function loadBacklogItems() {
  const { data, error } = await db
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

  list.querySelectorAll('.backlog-circle').forEach(btn => {
    btn.addEventListener('click', onMarkBacklogDone);
  });

  list.querySelectorAll('.backlog-delete').forEach(btn => {
    btn.addEventListener('click', onDeleteBacklogItem);
  });
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
   Grid of past Today cards
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
    const allTasks   = card.tasks || [];
    const filled     = allTasks.filter(t => t.text);
    const completed  = filled.filter(t => t.completed).length;
    const total      = filled.length;
    const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Show up to 5 task previews on the mini card
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

// Opens a full-size read-only view of a past card in a modal
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
   Counts consecutive days where at least one task was written
   ============================================================ */

async function updateStreak() {
  const { data } = await db
    .from('today_cards')
    .select('date, tasks')
    .order('date', { ascending: false })
    .limit(90);

  let streak = 0;

  if (data && data.length > 0) {
    // Build a Set of dates that count as "active" (had at least one task written)
    const activeDates = new Set(
      data
        .filter(card => (card.tasks || []).some(t => t.text))
        .map(card => card.date)
    );

    // Walk backwards from today, counting consecutive active days
    let checkDate = new Date();
    for (let i = 0; i < 90; i++) {
      const y   = checkDate.getFullYear();
      const m   = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d   = String(checkDate.getDate()).padStart(2, '0');
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
   At midnight, page reloads so a fresh Today card is created
   ============================================================ */

function scheduleMidnightReload() {
  const now      = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 10, 0); // 10 seconds after midnight
  const msUntil  = midnight - now;

  setTimeout(() => {
    window.location.reload();
  }, msUntil);
}

/* ============================================================
   LOADING SCREEN
   ============================================================ */

function hideLoading() {
  const overlay = document.getElementById('loading');
  overlay.classList.add('fade-out');
  setTimeout(() => overlay.classList.add('hidden'), 420);
}

/* ============================================================
   EVENT LISTENERS
   All button clicks and interactions wired up here
   ============================================================ */

function setupEventListeners() {

  // --- Archive button (opens archive view) ---
  document.getElementById('archive-btn').addEventListener('click', () => {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('archive-view').classList.remove('hidden');
    loadArchive();
  });

  // --- Back button (returns from archive to main) ---
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('archive-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
  });

  // --- Close archive card modal ---
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('card-modal').classList.add('hidden');
  });

  // --- Clicking the dark overlay behind a modal also closes it ---
  document.getElementById('card-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('card-modal')) {
      document.getElementById('card-modal').classList.add('hidden');
    }
  });

  // --- Someday and Future mini cards ---
  ['someday', 'future'].forEach(type => {

    // Clicking the card header expands/collapses it
    document.getElementById(`${type}-header`).addEventListener('click', () => {
      document.getElementById(`${type}-card`).classList.toggle('expanded');
    });

    // The + button adds a new item
    document.getElementById(`${type}-add-btn`).addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent the click from also toggling the card
      addBacklogItem(type);
    });

    // Pressing Enter in the input also adds a new item
    document.getElementById(`${type}-input`).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBacklogItem(type);
      e.stopPropagation();
    });

    // Clicking the input shouldn't collapse the card
    document.getElementById(`${type}-input`).addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

/* ============================================================
   UTILITIES
   ============================================================ */

// Safely converts text so it can be displayed inside HTML
// without accidentally running as code
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// Delays a function call until typing has paused for `delay` milliseconds
// This prevents saving to the database on every single keystroke
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================================
   START THE APP
   ============================================================ */

init();
