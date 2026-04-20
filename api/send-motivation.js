const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TO_EMAIL = process.env.TO_EMAIL;

const messages = [
  "You said this mattered. Prove it.",
  "Everyone who doubted you is watching. What are you doing right now?",
  "The version of you that achieves this doesn't make excuses. Be that person TODAY.",
  "Stop waiting to feel ready. You will never feel ready. Move anyway.",
  "Your competition isn't resting. What's your excuse?",
  "This is the work. Not the glamour. Not the results. THIS moment, right now. Do the work.",
  "You've been comfortable long enough. Comfortable doesn't build anything.",
  "Future you is either grateful or disappointed. You're deciding which one right now.",
  "No one is coming to save you. No one is going to do this for you. Get up.",
  "The goal doesn't care how you feel today. Show up anyway.",
  "Discipline is doing it when you don't want to. You don't want to right now. Do it anyway.",
  "Every day you delay is a day you hand to someone else who wants it more.",
  "You already know what you need to do. Stop pretending you don't.",
  "Mediocrity is comfortable. Is that what you came here for?",
  "The people living the life you want didn't get there by being soft.",
  "What would the hardest version of you do right now? Go do that.",
  "You're not tired. You're avoiding. There's a difference.",
  "This is your reminder that time is running out and excuses don't age well.",
  "The gap between who you are and who you want to be is closed by action. Not intentions.",
  "You set these goals for a reason. Remember that reason. NOW MOVE."
];

async function sbFetch(path) {
  const res = await fetch(SUPABASE_URL + path, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEmailHtml(goal, pinnedImage, randomImage, message) {
  const goalBlock = goal
    ? `<li style="margin-bottom:10px; font-size:16px; line-height:1.5;">${goal.text}</li>`
    : '<li style="color:#888;">No goals set yet. Go add some.</li>';

  const pinnedBlock = pinnedImage ? `
    <div style="background:#0a0a0a; padding:28px 28px 0;">
      <h2 style="color:gold; font-size:14px; letter-spacing:3px; text-transform:uppercase; margin:0 0 16px;">
        📌 Always Remember This
      </h2>
      <img src="${pinnedImage.url}" alt="pinned motivation"
        style="width:100%; max-width:500px; border-radius:6px; display:block; margin:0 auto; border:3px solid gold;" />
    </div>
  ` : '';

  const randomImageBlock = randomImage ? `
    <div style="background:#0a0a0a; padding:28px;">
      <h2 style="color:#d62828; font-size:14px; letter-spacing:3px; text-transform:uppercase; margin:0 0 20px;">
        🔥 Remember Why
      </h2>
      <div style="margin-bottom:16px;">
        <img src="${randomImage.url}" alt="motivation"
          style="width:100%; max-width:500px; border-radius:6px; display:block; margin:0 auto; border:3px solid #d62828;" />
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
    <body style="margin:0; padding:0; background:#0a0a0a; font-family: Arial, sans-serif;">
      <div style="max-width:600px; margin:0 auto; padding:0;">

        <div style="background:#d62828; padding:24px 28px;">
          <h1 style="margin:0; color:#f0ede8; font-size:28px; letter-spacing:4px; text-transform:uppercase;">⚡ NO EXCUSES</h1>
          <p style="margin:6px 0 0; color:#ffcccc; font-size:12px; letter-spacing:2px; text-transform:uppercase;">Your accountability check-in</p>
        </div>

        <div style="background:#1a1a1a; padding:32px 28px; border-left:4px solid #d62828; margin:0;">
          <p style="color:#f0ede8; font-size:22px; font-weight:700; line-height:1.4; margin:0;">
            "${message}"
          </p>
        </div>

        ${pinnedBlock}

        <div style="background:#111; padding:28px;">
          <h2 style="color:#d62828; font-size:14px; letter-spacing:3px; text-transform:uppercase; margin:0 0 16px;">
            🎯 What You're Fighting For
          </h2>
          <ul style="color:#f0ede8; padding-left:20px; margin:0;">
            ${goalBlock}
          </ul>
        </div>

        ${randomImageBlock}

        <div style="background:#0a0a0a; padding:20px 28px; border-top:1px solid #1a1a1a;">
          <p style="color:#444; font-size:12px; margin:0; text-align:center; letter-spacing:1px;">
            YOU ASKED FOR THIS. NO EXCUSES.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [goals, images] = await Promise.all([
      sbFetch('/rest/v1/goals?order=created_at.asc'),
      sbFetch('/rest/v1/images?order=created_at.asc')
    ]);

    const pinnedImage = images.find(img => img.pinned) || null;
    const unpinnedImages = images.filter(img => !img.pinned);

    const randomGoal = goals.length > 0 ? pickRandom(goals) : null;
    const randomImage = unpinnedImages.length > 0 ? pickRandom(unpinnedImages) : null;

    const message = pickRandom(messages);
    const html = buildEmailHtml(randomGoal, pinnedImage, randomImage, message);

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'No Excuses <onboarding@resend.dev>',
        to: TO_EMAIL,
        subject: `⚡ ${message.substring(0, 60)}...`,
        html: html
      })
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) throw new Error(emailData.message || 'Resend error');

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Send motivation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
