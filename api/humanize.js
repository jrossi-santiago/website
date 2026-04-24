// Check API key first
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables. Go to Vercel → Settings → Environment Variables and add it.' 
    });
  }

  const { text, mode } = req.body || {};

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const modeInstructions = {
    subtle: `You are rewriting an AI-generated email to sound slightly more natural and human. 
Rules:
- Keep it mostly the same — just soften the robotic polish
- Remove 2-3 obviously AI phrases like "I hope this finds you well", "please don't hesitate", "best regards"
- Very minor word swaps to sound more casual (e.g. "utilize" → "use", "leverage" → "use")
- Keep full sentences, grammar, punctuation intact
- Sign off naturally: "Thanks" or just a name`,

    human: `You are rewriting an AI-generated email to sound like a real busy human typed it.
Rules:
- Remove ALL AI-ish phrases: "certainly", "absolutely", "I'd be happy to", "leverage", "utilize", "touch base", "circle back", "synergy", "moving forward", "as per", "please don't hesitate", "best regards", "I hope this email finds you well"
- Shorter sentences. Less fluff.
- Occasional missing comma or lowercase where a human wouldn't bother
- Maybe 1 small typo (like a doubled word or missing small word)
- Sign off: "Thanks" or "Talk soon" or just name
- Sound like someone typing on their laptop between meetings`,

    ceo: `You are rewriting an AI-generated email to sound like it was typed by an extremely busy CEO on their phone in 30 seconds.
Rules:
- Strip it down to almost nothing — just the core ask or point
- Very short. Blunt. No pleasantries at all.
- Lowercase where a real person wouldn't capitalize
- Abbreviations: lmk, fyi, tbh, asap, pls, thx, ngl
- Incomplete sentences are fine. Fragments. Just the vibe.
- 1-2 typos or autocorrect errors like missing apostrophes e.g. "dont" "cant" "wont"
- Do NOT include "Sent from my iPhone" in your rewritten text — the app adds that separately
- Maximum 3-4 lines total. Cut everything non-essential.
- Sound like someone who has 400 unread emails and typed this with one thumb`
  };

  const instruction = modeInstructions[mode] || modeInstructions.human;

  let claudeResponse;

  try {
    claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${instruction}

After rewriting, list the key changes you made as short bullet points.

You MUST respond in this EXACT format. Do not add any text before REWRITTEN: or after the last bullet point:

REWRITTEN:
[rewritten email here]

CHANGES:
- [change 1]
- [change 2]
- [change 3]

Original email:

${text}`
          }
        ]
      })
    });
  } catch (fetchError) {
    return res.status(500).json({ 
      error: 'Could not reach the Anthropic API. Network error: ' + fetchError.message 
    });
  }

  if (!claudeResponse.ok) {
    let errorBody;
    try {
      errorBody = await claudeResponse.json();
      return res.status(500).json({ 
        error: 'Anthropic API error (' + claudeResponse.status + '): ' + (errorBody?.error?.message || JSON.stringify(errorBody))
      });
    } catch (e) {
      const rawError = await claudeResponse.text();
      return res.status(500).json({ 
        error: 'Anthropic API returned status ' + claudeResponse.status + '. Response: ' + rawError.slice(0, 300)
      });
    }
  }

  let data;
  try {
    data = await claudeResponse.json();
  } catch (parseError) {
    return res.status(500).json({ 
      error: 'Claude responded but could not parse it. Parse error: ' + parseError.message
    });
  }

  if (!data.content || !data.content[0] || !data.content[0].text) {
    return res.status(500).json({ 
      error: 'Claude response missing content. Got: ' + JSON.stringify(data).slice(0, 300)
    });
  }

  const fullResponse = data.content[0].text;

  let rewritten = '';
  let changes = '';

  const rewrittenMatch = fullResponse.match(/REWRITTEN:\s*\n([\s\S]*?)(?:\n\nCHANGES:|\nCHANGES:)/);
  const changesMatch = fullResponse.match(/CHANGES:\s*\n([\s\S]*)$/);

  if (rewrittenMatch) {
    rewritten = rewrittenMatch[1].trim();
  } else {
    const parts = fullResponse.split(/\nCHANGES:/);
    rewritten = parts[0].replace(/^REWRITTEN:\s*\n?/, '').trim();
  }

  if (changesMatch) {
    changes = changesMatch[1].trim();
  } else {
    changes = 'Changes made based on selected mode.';
  }

  if (!rewritten) {
    return res.status(500).json({ 
      error: 'Could not parse Claude response. Raw: ' + fullResponse.slice(0, 400)
    });
  }

  return res.status(200).json({ rewritten, changes });
}
