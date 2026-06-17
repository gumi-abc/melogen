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
    const startRes = await fetch('https://api.replicate.com/v1/models/meta/musicgen/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          duration: parseInt(duration) || 15,
          output_format: 'wav',
        }
      }),
    });

    const result = await startRes.json();
    if (!startRes.ok) return res.status(startRes.status).json(result);
    if (!result.output) return res.status(500).json({ error: '生成失敗' });

    const audioRes = await fetch(result.output);
    const buffer = await audioRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.send(Buffer.from(buffer));

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
