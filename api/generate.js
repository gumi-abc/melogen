module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, apiKey, duration } = req.body;

  if (!prompt || !apiKey) {
    return res.status(400).json({ error: 'prompt and apiKey are required' });
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/musicgen-small',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt + `, high quality instrumental music, ${duration || 15} seconds`,
          parameters: { max_new_tokens: (duration || 15) * 50 }
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error || 'HuggingFace API error' });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.send(Buffer.from(buffer));

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
