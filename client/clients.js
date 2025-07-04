document.getElementById('submitBtn').addEventListener('click', async () => {
  const res = await fetch('https://himmel-goryon-api.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'ping' })
  });

  const result = await res.json();
  document.getElementById('responseBox').textContent = result.message || 'エラー';
});
