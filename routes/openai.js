// routes/openai.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple rate-limiting (very small) - optional but recommended
let lastRequest = 0;
const MIN_DELAY = 300; // ms between requests per server (simple)

router.post('/chat', async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastRequest < MIN_DELAY) {
      return res.status(429).json({ error: 'Too many requests — slow down' });
    }
    lastRequest = now;

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages (array) is required' });
    }

    // Call OpenAI Chat Completions
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-4o', 'gpt-4' etc depending on your access
      messages: messages,
      max_tokens: 800
    });

    // The shape of returned choice (depends on SDK version); choose safe path:
    const choice = response.choices && response.choices[0];
    const content = choice?.message?.content ?? (choice?.delta?.content ?? '');

    return res.json({ id: response.id, content, raw: response });
  } catch (err) {
    console.error('OpenAI error', err);
    return res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

module.exports = router;
