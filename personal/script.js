/* ============================================
   DAILY BRIEFING — script.js
   ============================================ */

// ── Supabase setup ──────────────────────────
const SUPABASE_URL = 'https://urfsijczxmngbixprdkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZnNpamN6eG1uZ2JpeHByZGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTU1NzIsImV4cCI6MjA5MTA3MTU3Mn0.KxNLu5Rg0A0IdxQbaAapDa-vmTkVmeUlub689o0ZOaM';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Debounce helper ──────────────────────────
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── Get today's date in EST ──────────────────
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
function formatDateDisplay(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
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

// ── Map weather code to emoji + label ───────
function interpretWeatherCode(code) {
  if (code === 0)              return { emoji: '☀',  label: 'CLEAR' };
  if (code <= 2)               return { emoji: '⛅',  label: 'PARTLY CLOUDY' };
  if (code === 3)              return { emoji: '☁',  label: 'OVERCAST' };
  if (code <= 49)              return { emoji: '🌫',  label: 'FOG' };
  if (code <= 57)              return { emoji: '🌧',  label: 'DRIZZLE' };
  if (code <= 65)              return { emoji: '🌧',  label: 'RAIN' };
  if (code <= 77)              return { emoji: '❄',  label: 'SNOW' };
  if (code <= 82)              return { emoji: '🌦',  label: 'SHOWERS' };
  if (code <= 86)              return { emoji: '🌨',  label: 'SNOW SHOWERS' };
  if (code <= 99)              return { emoji: '⛈',  label: 'THUNDERSTORM' };
  return { emoji: '🌡',  label: 'UNKNOWN' };
}

// ── Format hour for display ──────────────────
function formatHour(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:00${ampm}`;
}

// ── Generate random receipt token code ────────────
function generateTokenCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  
  const el = document.getElementById('token-code');
  if (el) el.textContent = code;
}

// ═══════════════════════════════════════════════
// SECTION 1: HEADER
// ═══════════════════════════════════════════════

function initHeader() {
  const today = getTodayEST();
  document.getElementById('date-display').textContent = formatDateDisplay(today);
  document.getElementById('footer-date').textContent = formatDateDisplay(today);
}

// ═══════════════════════════════════════════════
// SECTION 2: WEATHER
// ═══════════════════════════════════════════════

async function initWeather() {
  const LAT = 41.4901;
  const LNG = -75.7052;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LNG}` +
    `&hourly=temperature_2m,weathercode,precipitation_probability` +
    `&daily=sunrise,sunset` +
    `&temperature_unit=fahrenheit` +
    `&timezone=America%2FNew_York` +
    `&forecast_days=2`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();

    const hours = data.hourly.time;
    const temps = data.hourly.temperature_2m;
    const codes = data.hourly.weathercode;
    const precip = data.hourly.precipitation_probability;
    const sunrise = data.daily.sunrise[0];
    const sunset = data.daily.sunset[0];

    const currentHour = getCurrentHourEST();
    const todayEST = getTodayEST();
    const currentHourStr = `${todayEST}T${String(currentHour).padStart(2, '0')}:00`;
    const startIndex = hours.findIndex(h => h === currentHourStr);

    if (startIndex === -1) {
      document.getElementById('weather-condition').textContent = '[ NO DATA ]';
      return;
    }

    // Current conditions
    const currentCode = codes[startIndex];
    const currentTemp = Math.round(temps[startIndex]);
    const currentPrecip = precip[startIndex];
    const { emoji, label } = interpretWeatherCode(currentCode);

    // Update condition label
    document.getElementById('weather-condition').textContent = `[ ${label} ]`;
    document.getElementById('weather-icon').textContent = emoji;
    document.getElementById('weather-temp').textContent = `${currentTemp}°F`;

    // Format times
    function fmtTime(dtStr) {
      if (!dtStr) return '--';
      const t = new Date(dtStr);
      const h = t.getHours() % 12 || 12;
      const m = String(t.getMinutes()).padStart(2, '0');
      const ap = t.getHours() < 12 ? 'AM' : 'PM';
      return `${h}:${m}${ap}`;
    }

    // Update sunrise, sunset, precip
    document.getElementById('weather-sunrise').textContent = fmtTime(sunrise);
    document.getElementById('weather-sunset').textContent = fmtTime(sunset);
    document.getElementById('weather-precip').textContent = `${currentPrecip}%`;

    // Dot grid — fill proportional to precip
    const dotGrid = document.getElementById('dot-grid');
    dotGrid.innerHTML = '';
    const totalDots = 50;
    const activeDots = Math.round((currentPrecip / 100) * totalDots);
    for (let d = 0; d < totalDots; d++) {
      const dot = document.createElement('span');
      if (d < activeDots) dot.classList.add('active');
      dotGrid.appendChild(dot);
    }

    // Hourly rows
    const hourly = document.getElementById('weather-hourly');
    hourly.innerHTML = '';

    for (let i = startIndex; i < startIndex + 12 && i < hours.length; i++) {
      const hourNum = new Date(hours[i]).getHours();
      const { emoji: hEmoji, label: hLabel } = interpretWeatherCode(codes[i]);
      const hTemp = Math.round(temps[i]);

      const row = document.createElement('div');
      row.className = 'weather-hour-row';
      row.innerHTML = `
        <span class="wh-time">${formatHour(hourNum)}</span>
        <span class="wh-emoji">${hEmoji}</span>
        <span class="wh-cond">${hLabel}</span>
        <span class="wh-temp">${hTemp}°F</span>
      `;
      hourly.appendChild(row);
    }

  } catch (err) {
    document.getElementById('weather-condition').textContent = '[ UNAVAILABLE ]';
    console.error('Weather error:', err);
  }
}

// ═══════════════════════════════════════════════
// SECTION 3: DAILY INTENTIONS
// ═══════════════════════════════════════════════

let currentIntentionData = null;

async function initIntentions() {
  const today = getTodayEST();

  const { data, error } = await db
    .from('daily_intentions')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading intentions:', error);
  }

  if (data) {
    currentIntentionData = data;
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`intention-${i}`);
      if (input && data[`intention_${i}`]) {
        input.value = data[`intention_${i}`];
      }
    }
  }

  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`intention-${i}`);
    if (input) {
      input.addEventListener('input', debouncedSaveIntentions);
    }
  }
}

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
  };

  const { error } = await db
    .from('daily_intentions')
    .upsert(payload, { onConflict: 'date' });

  if (error) {
    console.error('Save error:', error);
    status.textContent = 'ERROR SAVING';
  } else {
    status.textContent = 'SAVED';
    setTimeout(() => { status.textContent = ''; }, 2000);
  }
}

// ═══════════════════════════════════════════════
// SECTION 4: MOTIVATIONAL QUOTE
// ═══════════════════════════════════════════════

let loadedQuoteText = '';

async function initQuote() {
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
// ═══════════════════════════════════════════════

let loadedPrayerUrl = '';

async function initPrayerImage() {
  await loadRandomImageFromBucket('prayer_images', 'prayer-frame', 'Prayer image', (url) => {
    loadedPrayerUrl = url;
  });
}

// ═══════════════════════════════════════════════
// SECTION 6: INSPIRATIONAL IMAGE
// ═══════════════════════════════════════════════

let loadedInspirationUrl = '';

async function initInspirationImage() {
  await loadRandomImageFromBucket('inspirational_images', 'inspiration-frame', 'Inspiration image', (url) => {
    loadedInspirationUrl = url;
  });
}

// ── Shared helper: load random image from a bucket ──
async function loadRandomImageFromBucket(bucketName, frameId, altText, onLoad) {
  const frame = document.getElementById(frameId);

  const { data: files, error } = await db.storage
    .from(bucketName)
    .list('', { limit: 100, offset: 0 });

  if (error || !files || files.length === 0) {
    frame.innerHTML = `<p class="placeholder">NO IMAGES FOUND.</p>`;
    console.error(`${bucketName} error:`, error);
    return;
  }

  const imageFiles = files.filter(f =>
    f.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
  );

  if (imageFiles.length === 0) {
    frame.innerHTML = `<p class="placeholder">NO IMAGES FOUND.</p>`;
    return;
  }

  const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];

  const { data: urlData } = db.storage
    .from(bucketName)
    .getPublicUrl(randomFile.name);

  const publicUrl = urlData.publicUrl;
  if (onLoad) onLoad(publicUrl);

  frame.innerHTML = `<img src="${publicUrl}" alt="${altText}" loading="lazy" />`;
}

// ═══════════════════════════════════════════════
// SECTION 7: ARCHIVE
// ═══════════════════════════════════════════════

async function initArchive() {
  document.getElementById('archive-btn').addEventListener('click', archiveToday);
  await loadArchiveList();
}

async function archiveToday() {
  const today = getTodayEST();
  const status = document.getElementById('archive-status');
  const btn = document.getElementById('archive-btn');

  btn.disabled = true;
  btn.textContent = 'ARCHIVING...';

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
    intentions_data: intentionsData,
    quote_text: loadedQuoteText,
    prayer_image_url: loadedPrayerUrl,
    inspiration_image_url: loadedInspirationUrl,
  };

  const { error } = await db
    .from('archived_reports')
    .upsert(payload, { onConflict: 'date' });

  btn.disabled = false;
  btn.textContent = 'ARCHIVE TODAY';

  if (error) {
    console.error('Archive error:', error);
    status.textContent = 'ERROR — COULD NOT ARCHIVE.';
  } else {
    status.textContent = `ARCHIVED — ${formatDateDisplay(today)}`;
    setTimeout(() => { status.textContent = ''; }, 4000);
    await loadArchiveList();
  }
}

async function loadArchiveList() {
  const container = document.getElementById('archive-list');

  const { data, error } = await db
    .from('archived_reports')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    container.innerHTML = '<div style="font-size:9px; color:#999;">COULD NOT LOAD ARCHIVE.</div>';
    console.error('Archive load error:', error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<div style="font-size:9px; color:#999;">NO ARCHIVED REPORTS YET.</div>';
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

    let contentHTML = '';

    if (intentionItems.length > 0) {
      contentHTML += `<div class="archive-label">INTENTIONS</div>`;
      intentionItems.forEach(item => {
        contentHTML += `<div class="archive-intention">${escapeHTML(item)}</div>`;
      });
    }

    if (report.quote_text) {
      contentHTML += `<div class="archive-label">QUOTE</div>`;
      contentHTML += `<div class="archive-quote">${escapeHTML(report.quote_text)}</div>`;
    }

    if (report.prayer_image_url || report.inspiration_image_url) {
      contentHTML += `<div class="archive-label">IMAGES</div>`;
      contentHTML += `<div class="archive-images">`;
      if (report.prayer_image_url) {
        contentHTML += `<img class="archive-image-thumb" src="${report.prayer_image_url}" alt="Prayer" loading="lazy" />`;
      }
      if (report.inspiration_image_url) {
        contentHTML += `<img class="archive-image-thumb" src="${report.inspiration_image_url}" alt="Inspiration" loading="lazy" />`;
      }
      contentHTML += `</div>`;
    }

    if (!contentHTML) {
      contentHTML = '<div style="font-size:9px; color:#999;">NO DATA SAVED.</div>';
    }

    entry.innerHTML = `
      <div class="archive-date-row">
        <span class="archive-date-label">${formatDateDisplay(report.date)}</span>
        <span class="archive-toggle">▶</span>
      </div>
      <div class="archive-content">
        ${contentHTML}
      </div>
    `;

    const dateRow = entry.querySelector('.archive-date-row');
    const contentPanel = entry.querySelector('.archive-content');
    const icon = entry.querySelector('.archive-toggle');

    function toggleEntry() {
      const isOpen = contentPanel.classList.contains('expanded');
      contentPanel.classList.toggle('expanded', !isOpen);
      icon.classList.toggle('open', !isOpen);
    }

    dateRow.addEventListener('click', toggleEntry);
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
  generateTokenCode();

  await Promise.allSettled([
    initWeather(),
    initIntentions(),
    initQuote(),
    initPrayerImage(),
    initInspirationImage(),
    initArchive(),
  ]);
}

document.addEventListener('DOMContentLoaded', init);
