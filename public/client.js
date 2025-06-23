// client.js
async function sendMessage() {
  const btn        = document.getElementById('sendBtn');
  const resBox     = document.getElementById('responseBox');
  const companion  = document.getElementById('companion').value;
  const preference = document.getElementById('preference').value;
  const mood       = document.getElementById('mood').value;
  const freeInput  = document.getElementById('freeInput').value.trim();

  // バリデーション
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
    const { reply } = await resp.json();

    // 改行＋空行を確実に入れる
    resBox.innerHTML = `
<p>🍽 <strong>おすすめメニュー</strong></p>
<p>${reply.recommend}</p>

<p>📝 <strong>おすすめ理由</strong></p>
<p>${reply.story}</p>

<p>🍶 <strong>相性のペアリング</strong></p>
<p>${reply.pairing}</p>
    `;
  } catch (e) {
    console.error(e);
    resBox.innerText = '❌ エラーが発生しました';
  } finally {
    btn.disabled  = false;
    btn.innerText = '▶ 提案を聞く';
  }
}
