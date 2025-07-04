// client/clients.js

// ↓ 最後に必ず自分のVercelドメインに書き換えてください ↓
const API_ENDPOINT = 'https://＜あなたの-Vercelドメイン＞/api/chat';

document.addEventListener('DOMContentLoaded', () => {
  // --- 日付チェック＆回数制限（入力Embed用） ---
  const msgEl   = document.getElementById('message');
  const usageEl = document.getElementById('usageNotice');
  const today   = new Date().toISOString().slice(0,10);
  const urlDate = new URLSearchParams(window.location.search).get('date');
  const usageKey = `usage_${today}`;
  let count = parseInt(localStorage.getItem(usageKey) || '0', 10);

  if (msgEl && usageEl) {
    if (!urlDate || urlDate !== today) {
      msgEl.textContent = 'このURLの有効期限は切れています。QRコードを再読み込みしてください。';
      const btn = document.getElementById('sendBtn');
      if (btn) btn.disabled = true;
    } else {
      usageEl.textContent = `利用回数：残り${Math.max(0,3 - count)}回`;
    }
  }

  // --- 送信＆表示（送信Embed＋表示Embed共通） ---
  const sendBtn     = document.getElementById('sendBtn');
  const responseBox = document.getElementById('responseBox');

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      if (count >= 3) {
        if (responseBox) responseBox.textContent = '⚠️ 本日の提案は上限の3回に達しました';
        return;
      }

      const companionEl  = document.getElementById('companion');
      const preferenceEl = document.getElementById('preference');
      const moodEl       = document.getElementById('mood');
      const freeInputEl  = document.getElementById('freeInput');
      const usageEl2     = document.getElementById('usageNotice');

      const companion  = companionEl?.value;
      const preference = preferenceEl?.value;
      const mood       = moodEl?.value;
      const freeInput  = freeInputEl?.value.trim() || '';

      if (!companion || !preference || !mood) {
        if (responseBox) responseBox.textContent = '⚠️ 全て選択してください';
        return;
      }

      sendBtn.disabled    = true;
      sendBtn.textContent = '🍶 考え中…';
      if (responseBox) responseBox.textContent = '🍶 ご提案を考え中です…';

      try {
        const res = await fetch(API_ENDPOINT, {
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

        // カウント更新
        count += 1;
        localStorage.setItem(usageKey, count);
        if (usageEl2) usageEl2.textContent = `利用回数：残り${Math.max(0,3 - count)}回`;

        // 結果表示
        if (responseBox) responseBox.innerHTML = `
          <p>🍽 <strong>おすすめメニュー</strong></p>
          <p>${recommend}</p>
          <p>📝 <strong>おすすめ理由</strong></p>
          <p>${story}</p>
          <p>🍶 <strong>相性のペアリング</strong></p>
          <p>${pairing}</p>
        `;
      } catch (err) {
        console.error(err);
        if (responseBox) responseBox.textContent = '❌ エラーが発生しました';
      } finally {
        sendBtn.disabled    = false;
        sendBtn.textContent = '▶ 提案を聞く';
      }
    });
  }
});
