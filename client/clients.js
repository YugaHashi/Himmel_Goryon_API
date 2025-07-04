// client/clients.js
document.addEventListener('DOMContentLoaded', () => {
  const msgEl        = document.getElementById('message');
  const usageEl      = document.getElementById('usageNotice');
  const companionEl  = document.getElementById('companion');
  const preferenceEl = document.getElementById('preference');
  const moodEl       = document.getElementById('mood');
  const freeInputEl  = document.getElementById('freeInput');
  const sendBtn      = document.getElementById('sendBtn');
  const responseBox  = document.getElementById('responseBox');

  // 有効期限チェック & 回数制限読み込み
  const urlDate  = new URLSearchParams(window.location.search).get('date');
  const today    = new Date().toISOString().slice(0,10);
  const usageKey = `usage_${today}`;
  let count      = parseInt(localStorage.getItem(usageKey) || '0', 10);

  if (!urlDate || urlDate !== today) {
    msgEl.textContent = 'このURLの有効期限は切れています。QRコードを再読み込みしてください。';
    sendBtn.disabled = true;
    return;
  } else {
    usageEl.textContent = `利用回数：残り${Math.max(0,3-count)}回`;
  }

  sendBtn.addEventListener('click', async () => {
    if (count >= 3) {
      responseBox.textContent = '⚠️ 本日の提案は上限の3回に達しました';
      return;
    }
    const companion  = companionEl.value;
    const preference = preferenceEl.value;
    const mood       = moodEl.value;
    const freeInput  = freeInputEl.value.trim();
    if (!companion || !preference || !mood) {
      responseBox.textContent = '⚠️ 全て選択してください';
      return;
    }

    sendBtn.disabled   = true;
    sendBtn.textContent = '🍶 考え中…';
    responseBox.textContent = '🍶 ご提案を考え中です…';

    try {
      const res = await fetch(process.env.API_ENDPOINT, {
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
      if (!res.ok) throw new Error('Network response was not ok');
      const { recommend, story, pairing } = await res.json();

      // 回数をインクリメント
      count += 1;
      localStorage.setItem(usageKey, count);
      usageEl.textContent = `利用回数：残り${Math.max(0,3-count)}回`;

      // 表示更新
      responseBox.innerHTML = `
        <p>🍽 <strong>おすすめメニュー</strong></p>
        <p>${recommend}</p>
        <p>📝 <strong>おすすめ理由</strong></p>
        <p>${story}</p>
        <p>🍶 <strong>相性のペアリング</strong></p>
        <p>${pairing}</p>
      `;
    } catch (err) {
      console.error(err);
      responseBox.textContent = '❌ エラーが発生しました';
    } finally {
      sendBtn.disabled   = false;
      sendBtn.textContent = '▶ 提案を聞く';
    }
  });
});

