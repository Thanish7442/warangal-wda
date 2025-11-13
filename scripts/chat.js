/*// public/js/chat.js
document.addEventListener('DOMContentLoaded', () => {
  const chatLog = document.getElementById('chatLog');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('userInput');

  const messages = [
    { role: 'system', content: 'You are the official assistant of Warangal Defence Academy. Be concise, polite, and factual.' }
  ];

  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = role === 'user' ? 'text-right my-2' : 'text-left my-2';
    div.innerHTML = `<div class="inline-block px-3 py-2 rounded-lg ${
      role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border'
    }">${text}</div>`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    appendMessage('user', userText);
    messages.push({ role: 'user', content: userText });
    input.value = '';
    input.disabled = true;

    appendMessage('assistant', '...');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      chatLog.removeChild(chatLog.lastChild);
      if (data.error) throw new Error(data.error);

      const reply = data.content || '(no reply)';
      appendMessage('assistant', reply);
      messages.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error(err);
      appendMessage('assistant', '⚠️ Unable to connect to AI service.');
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
});*/
