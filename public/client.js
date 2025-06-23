async function sendMessage() {
  const btn        = document.getElementById('sendBtn');
  const resBox     = document.getElementById('responseBox');
  const companion  = document.getElementById('companion').value;
  const preference = document.getElementById('preference').value;
  const mood       = document.getElementById('mood').value;
  const freeInput  = document.getElementById('freeInput').value.trim() || '';

  if (!companion || !preference || !mood) {
    resBox.innerText = '⚠️ 全て選択してください';
    return;
  }

  btn.disabled     = true;
  btn.innerText    = '🍶 考え中…';
  resBox.innerText = '🍶 ご提案を考え中です…';

  try {
    const resp = await fetch('https://himmel-api.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companion,
        preference,
        mood,
        freeInput,
        facility: '南平台ごりょんさん'
      })
    });
    const data = await resp.json();

    if (!data.reply) {
      throw new Error("No reply returned");
    }

    const reply = data.reply;

    resBox.innerHTML = `
<p>🍽 <strong>おすすめメニュー</strong></p><br>
<p>${reply.recommend}</p><br>

<p>📝 <strong>おすすめ理由</strong></p><br>
<p>${reply.story}</p><br>

<p>🍶 <strong>相性のペアリング</strong></p><br>
<p>${reply.pairing}</p><br>
    `;
  } catch (e) {
    console.error(e);
    resBox.innerText = '❌ エラーが発生しました';
  } finally {
    btn.disabled  = false;
    btn.innerText = '▶ 提案を聞く';
  }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
