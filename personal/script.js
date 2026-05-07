/* ============================================
   DAILY BRIEFING — script.js
   ============================================ */

// ── Supabase setup ──────────────────────────
// Supabase = your free online database.
// The URL and key below tell this page which database to talk to.
// Replace these two values with your own from Supabase dashboard.
const SUPABASE_URL = 'https://urfsijczxmngbixprdkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZnNpamN6eG1uZ2JpeHByZGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTU1NzIsImV4cCI6MjA5MTA3MTU3Mn0.KxNLu5Rg0A0IdxQbaAapDa-vmTkVmeUlub689o0ZOaM';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Debounce helper ──────────────────────────
// "Debounce" means: wait until the user stops typing for X milliseconds
// before actually saving. This prevents a database call on every single keystroke.
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── Get today's date in EST ──────────────────
// EST = Eastern Standard Time (your timezone)
// This function always returns today's date as "YYYY-MM-DD" in EST,
// regardless of what timezone the browser is in.
function getTodayEST() {
  const now = new Date();
  const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const estDate = new Date(estString);
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Format a date string nicely ─────────────
// Turns "2026-05-07" into "WEDNESDAY, MAY 7, 2026"
function formatDateDisplay(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  // Use noon to avoid any timezone edge case flipping the day
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();
}

// ── Get current hour in EST ──────────────────
function getCurrentHourEST() {
  const now = new Date();
  const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(estString).getHours();
}

// ── Get greeting based on time of day ───────
function getGreeting() {
  const hour = getCurrentHourEST();
  if (hour < 12) return 'GOOD MORNING, JOE';
  if (hour < 17) return 'GOOD AFTERNOON, JOE';
  return 'GOOD EVENING, JOE';
}

// ── Map weather code to emoji + label ───────
// Open-Meteo returns a "weathercode" number.
// This function converts that number into a human-readable label and emoji.
function interpretWeatherCode(code) {
  if (code === 0)              return { emoji: '☀️',  label: 'CLEAR' };
  if (code <= 2)               return { emoji: '⛅',  label: 'PARTLY CLOUDY' };
  if (code === 3)              return { emoji: '☁️',  label: 'OVERCAST' };
  if (code <= 49)              return { emoji: '🌫️', label: 'FOG' };
  if (code <= 57)              return { emoji: '🌧️', label: 'DRIZZLE' };
  if (code <= 65)              return { emoji: '🌧️', label: 'RAIN' };
  if (code <= 77)              return { emoji: '❄️',  label: 'SNOW' };
  if (code <= 82)              return { emoji: '🌦️', label: 'SHOWERS' };
  if (code <= 86)              return { emoji: '🌨️', label: 'SNOW SHOWERS' };
  if (code <= 99)              return { emoji: '⛈️',  label: 'THUNDERSTORM' };
  return { emoji: '🌡️', label: 'UNKNOWN' };
}

// ── Format hour for display ──────────────────
// Turns 14 into "2:00 PM", turns 9 into "9:00 AM"
function formatHour(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
}

// ═══════════════════════════════════════════════
// SECTION 1: HEADER
// ═══════════════════════════════════════════════

function initHeader() {
  const today = getTodayEST();
  document.getElementById('greeting').textContent = getGreeting();
  document.getElementById('date-display').textContent = formatDateDisplay(today);
  document.getElementById('footer-date').textContent = formatDateDisplay(today);
}

// ═══════════════════════════════════════════════
// SECTION 2: WEATHER
// Open-Meteo is a free weather API — no account or API key needed.
// Lat/lng below are for Clarks Summit, PA.
// ═══════════════════════════════════════════════

async function initWeather() {
  const LAT = 41.4901;
  const LNG = -75.7052;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LNG}` +
    `&hourly=temperature_2m,weathercode` +
    `&temperature_unit=fahrenheit` +
    `&timezone=America%2FNew_York` +
    `&forecast_days=2`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();

    const hours = data.hourly.time;          // array of datetime strings
    const temps = data.hourly.temperature_2m; // array of temps
    const codes = data.hourly.weathercode;    // array of weather codes

    // Find the index of the current hour
    const currentHour = getCurrentHourEST();
    const todayEST = getTodayEST();

    // Build the target datetime string for the current hour, e.g. "2026-05-07T14:00"
    const currentHourStr = `${todayEST}T${String(currentHour).padStart(2, '0')}:00`;
    const startIndex = hours.findIndex(h => h === currentHourStr);

    if (startIndex === -1) {
      document.getElementById('weather-grid').innerHTML =
        '<p class="loading-text">WEATHER DATA UNAVAILABLE.</p>';
      return;
    }

    // Show 12 hours starting from now
    const grid = document.getElementById('weather-grid');
    grid.innerHTML = '';

    for (let i = startIndex; i < startIndex + 12 && i < hours.length; i++) {
      const hourNum = new Date(hours[i] + ':00').getHours();
      const { emoji, label } = interpretWeatherCode(codes[i]);
      const temp = Math.round(temps[i]);

      const row = document.createElement('div');
      row.className = 'weather-row';
      row.innerHTML = `
        <span class="weather-time">${formatHour(hourNum)}</span>
        <span class="weather-emoji">${emoji}</span>
        <span class="weather-condition">${label}</span>
        <span class="weather-temp">${temp}°F</span>
      `;
      grid.appendChild(row);
    }

  } catch (err) {
    document.getElementById('weather-grid').innerHTML =
      '<p class="loading-text">COULD NOT LOAD WEATHER.</p>';
    console.error('Weather error:', err);
  }
}

// ═══════════════════════════════════════════════
// SECTION 3: DAILY INTENTIONS
// Reads from and writes to the "daily_intentions" table in Supabase.
// Each day gets its own row, identified by today's EST date.
// ═══════════════════════════════════════════════

let currentIntentionData = null; // holds what's currently saved for today

async function initIntentions() {
  const today = getTodayEST();

  // Try to load today's row from the database
  const { data, error } = await db
    .from('daily_intentions')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows found" — that's fine, it just means no entry yet today
    console.error('Error loading intentions:', error);
  }

  if (data) {
    currentIntentionData = data;
    // Fill in the input fields with whatever was saved
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`intention-${i}`);
      if (input && data[`intention_${i}`]) {
        input.value = data[`intention_${i}`];
      }
    }
  }

  // Attach save handler to each input field
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`intention-${i}`);
    if (input) {
      input.addEventListener('input', debouncedSaveIntentions);
    }
  }
}

// This is the save function, wrapped in debounce so it waits
// 800ms after the user stops typing before saving
const debouncedSaveIntentions = debounce(saveIntentions, 800);

async function saveIntentions() {
  const today = getTodayEST();
  const status = document.getElementById('save-status');

  const payload = {
    date: today,
    intention_1: document.getElementById('intention-1').value.trim(),
    intention_2: document.getElementById('intention-2').value.trim(),
    intention_3: document.getElementById('intention-3').value.trim(),
    intention_4: document.getElementById('intention-4').value.trim(),
    intention_5: document.getElementById('intention-5').value.trim(),
    updated_at: new Date().toISOString(),
  };

  // "upsert" means: insert a new row if today doesn't exist yet,
  // or update the existing row if it does.
  const { error } = await db
    .from('daily_intentions')
    .upsert(payload, { onConflict: 'date' });

  if (error) {
    console.error('Save error:', error);
    status.textContent = 'ERROR SAVING.';
  } else {
    status.textContent = 'SAVED.';
    // Clear the "SAVED." message after 2 seconds
    setTimeout(() => { status.textContent = ''; }, 2000);
  }
}

// ═══════════════════════════════════════════════
// SECTION 4: MOTIVATIONAL QUOTE
// Reads from the "motivational_quotes" table.
// Picks a random row each page load.
// ═══════════════════════════════════════════════

let loadedQuoteText = ''; // store for archive use

async function initQuote() {
  // Fetch all quotes, then pick one randomly
  const { data, error } = await db
    .from('motivational_quotes')
    .select('id, quote_text');

  if (error || !data || data.length === 0) {
    document.getElementById('quote-text').textContent =
      'NO QUOTES FOUND. ADD SOME TO YOUR SUPABASE TABLE.';
    console.error('Quote error:', error);
    return;
  }

  const random = data[Math.floor(Math.random() * data.length)];
  loadedQuoteText = random.quote_text;
  document.getElementById('quote-text').textContent = loadedQuoteText;
}

// ═══════════════════════════════════════════════
// SECTION 5: PRAYER IMAGE
// Reads a random image from the "prayer_images" storage bucket.
// A "storage bucket" in Supabase is like a folder for storing files/images.
// ═══════════════════════════════════════════════

let loadedPrayerUrl = ''; // store for archive use

async function initPrayerImage() {
  await loadRandomImageFromBucket('prayer_images', 'prayer-frame', 'Prayer image', (url) => {
    loadedPrayerUrl = url;
  });
}

// ═══════════════════════════════════════════════
// SECTION 6: INSPIRATIONAL IMAGE
// Reads a random image from the "inspirational_images" storage bucket.
// ═══════════════════════════════════════════════

let loadedInspirationUrl = ''; // store for archive use

async function initInspirationImage() {
  await loadRandomImageFromBucket('inspirational_images', 'inspiration-frame', 'Inspiration image', (url) => {
    loadedInspirationUrl = url;
  });
}

// ── Shared helper: load random image from a bucket ──
async function loadRandomImageFromBucket(bucketName, frameId, altText, onLoad) {
  const frame = document.getElementById(frameId);

  // List all files in the bucket
  const { data: files, error } = await db.storage
    .from(bucketName)
    .list('', { limit: 100, offset: 0 });

  if (error || !files || files.length === 0) {
    frame.innerHTML = `<p class="loading-text">NO IMAGES FOUND IN "${bucketName.toUpperCase()}" BUCKET.</p>`;
    console.error(`${bucketName} error:`, error);
    return;
  }

  // Filter to only actual image files (skip any folder placeholders)
  const imageFiles = files.filter(f =>
    f.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
  );

  if (imageFiles.length === 0) {
    frame.innerHTML = `<p class="loading-text">NO IMAGES FOUND.</p>`;
    return;
  }

  // Pick one at random
  const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];

  // Get a public URL for that image
  const { data: urlData } = db.storage
    .from(bucketName)
    .getPublicUrl(randomFile.name);

  const publicUrl = urlData.publicUrl;
  if (onLoad) onLoad(publicUrl);

  // Display the image
  frame.innerHTML = `<img src="${publicUrl}" alt="${altText}" loading="lazy" />`;
}

// ═══════════════════════════════════════════════
// SECTION 7: ARCHIVE
// Saves today's report snapshot to the "archived_reports" table.
// Also loads and displays all past archived reports.
// ═══════════════════════════════════════════════

async function initArchive() {
  // Wire up the archive button
  document.getElementById('archive-btn').addEventListener('click', archiveToday);

  // Load the list of past archived days
  await loadArchiveList();
}

async function archiveToday() {
  const today = getTodayEST();
  const status = document.getElementById('archive-status');
  const btn = document.getElementById('archive-btn');

  btn.disabled = true;
  btn.textContent = '[ ARCHIVING... ]';

  // Gather current intentions from the input fields
  const intentionsData = {
    intention_1: document.getElementById('intention-1').value.trim(),
    intention_2: document.getElementById('intention-2').value.trim(),
    intention_3: document.getElementById('intention-3').value.trim(),
    intention_4: document.getElementById('intention-4').value.trim(),
    intention_5: document.getElementById('intention-5').value.trim(),
  };

  const payload = {
    date: today,
    archived_at: new Date().toISOString(),
    intentions_data: intentionsData,           // stored as JSON
    quote_text: loadedQuoteText,
    prayer_image_url: loadedPrayerUrl,
    inspiration_image_url: loadedInspirationUrl,
  };

  // upsert = save, and if today already exists, overwrite it
  const { error } = await db
    .from('archived_reports')
    .upsert(payload, { onConflict: 'date' });

  btn.disabled = false;
  btn.textContent = '[ ARCHIVE TODAY\'S REPORT ]';

  if (error) {
    console.error('Archive error:', error);
    status.textContent = 'ERROR — COULD NOT ARCHIVE.';
  } else {
    status.textContent = `ARCHIVED — ${formatDateDisplay(today)}`;
    setTimeout(() => { status.textContent = ''; }, 4000);
    // Refresh the archive list to show today
    await loadArchiveList();
  }
}

async function loadArchiveList() {
  const container = document.getElementById('archive-list');

  const { data, error } = await db
    .from('archived_reports')
    .select('*')
    .order('date', { ascending: false }); // newest first

  if (error) {
    container.innerHTML = '<p class="loading-text">COULD NOT LOAD ARCHIVE.</p>';
    console.error('Archive load error:', error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="loading-text">NO ARCHIVED REPORTS YET.</p>';
    return;
  }

  container.innerHTML = '';

  data.forEach(report => {
    const entry = document.createElement('div');
    entry.className = 'archive-entry';

    const intentions = report.intentions_data || {};
    const intentionItems = [1,2,3,4,5]
      .map(n => intentions[`intention_${n}`])
      .filter(Boolean);

    // Build the expanded content HTML
    let contentHTML = '';

    if (intentionItems.length > 0) {
      contentHTML += `<p class="archive-content-label">TOP 5</p>`;
      intentionItems.forEach(item => {
        contentHTML += `<p class="archive-intention-item">${escapeHTML(item)}</p>`;
      });
    }

    if (report.quote_text) {
      contentHTML += `<p class="archive-content-label">MOTIVATION</p>`;
      contentHTML += `<p class="archive-quote-text">${escapeHTML(report.quote_text)}</p>`;
    }

    if (report.prayer_image_url || report.inspiration_image_url) {
      contentHTML += `<p class="archive-content-label">IMAGES</p>`;
      contentHTML += `<div class="archive-image-row">`;
      if (report.prayer_image_url) {
        contentHTML += `<img class="archive-image-thumb" src="${report.prayer_image_url}" alt="Prayer" loading="lazy" />`;
      }
      if (report.inspiration_image_url) {
        contentHTML += `<img class="archive-image-thumb" src="${report.inspiration_image_url}" alt="Inspiration" loading="lazy" />`;
      }
      contentHTML += `</div>`;
    }

    if (!contentHTML) {
      contentHTML = '<p class="archive-intention-item">NO DATA SAVED.</p>';
    }

    entry.innerHTML = `
      <div class="archive-date-row" role="button" tabindex="0" aria-expanded="false">
        <span class="archive-date-label">${formatDateDisplay(report.date)}</span>
        <span class="archive-toggle-icon">▶</span>
      </div>
      <div class="archive-content">
        ${contentHTML}
      </div>
    `;

    // Toggle expand/collapse when clicking a date row
    const dateRow = entry.querySelector('.archive-date-row');
    const contentPanel = entry.querySelector('.archive-content');
    const icon = entry.querySelector('.archive-toggle-icon');

    function toggleEntry() {
      const isOpen = contentPanel.classList.contains('expanded');
      contentPanel.classList.toggle('expanded', !isOpen);
      icon.classList.toggle('open', !isOpen);
      dateRow.setAttribute('aria-expanded', String(!isOpen));
    }

    dateRow.addEventListener('click', toggleEntry);
    // Also allow keyboard activation (Enter or Space)
    dateRow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleEntry();
      }
    });

    container.appendChild(entry);
  });
}

// ── Safety helper: escapeHTML ────────────────
// Prevents any text from being accidentally treated as HTML code.
// This protects against a security issue called XSS (cross-site scripting).
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════
// BOOT — runs everything when the page loads
// ═══════════════════════════════════════════════

async function init() {
  initHeader();

  // Run weather and database calls in parallel for speed
  // "parallel" means all these start at the same time instead of waiting one by one
  await Promise.allSettled([
    initWeather(),
    initIntentions(),
    initQuote(),
    initPrayerImage(),
    initInspirationImage(),
    initArchive(),
  ]);
}

// Start everything once the page HTML is fully loaded
document.addEventListener('DOMContentLoaded', init);
