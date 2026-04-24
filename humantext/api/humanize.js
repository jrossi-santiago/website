export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, mode } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
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
- 1-2 typos or autocorrect errors (e.g. "teh", "fo", "adn", "yuo", missing apostrophes like "dont" "cant" "wont")
- Do NOT include "Sent from my iPhone" in your rewritten text — the app adds that separately
- Maximum 3-4 lines total. Cut everything non-essential.
- Sound like someone who has 400 unread emails and typed this with one thumb`
  };

  const instruction = modeInstructions[mode] || modeInstructions.human;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return res.status(500).json({ error: 'Claude API error: ' + response.status });
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      return res.status(500).json({ error: 'Unexpected response from Claude' });
    }

    const fullResponse = data.content[0].text;

    // Robust parsing — handles variations in Claude's formatting
    let rewritten = '';
    let changes = '';

    const rewrittenMatch = fullResponse.match(/REWRITTEN:\s*\n([\s\S]*?)(?:\n\nCHANGES:|\nCHANGES:)/);
    const changesMatch   = fullResponse.match(/CHANGES:\s*\n([\s\S]*)$/);

    if (rewrittenMatch) {
      rewritten = rewrittenMatch[1].trim();
    } else {
      // Fallback: everything before CHANGES:
      const parts = fullResponse.split(/\nCHANGES:/);
      rewritten = parts[0].replace(/^REWRITTEN:\s*\n?/, '').trim();
    }

    if (changesMatch) {
      changes = changesMatch[1].trim();
    } else {
      changes = 'Changes made based on selected mode.';
    }

    return res.status(200).json({ rewritten, changes });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Something went wrong: ' + error.message });
  }
}
