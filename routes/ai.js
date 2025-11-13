// routes/ai.js
// NOTE: The AI/OpenAI integration has been removed. This stub keeps the route file
// present in case other code attempts to require it, but it responds with 410 Gone.
const express = require('express');
const router = express.Router();

router.post('/chat', (req, res) => {
  return res.status(410).json({ error: 'AI/chat feature removed' });
});

module.exports = router;
