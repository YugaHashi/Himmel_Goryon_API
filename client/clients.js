(function(){
  // ✅ Vercelの実エンドポイントに修正済
  const API_ENDPOINT = 'https://himmel-goryon-api.vercel.app/api/chat';

  document.addEventListener('DOMContentLoaded', () => {
    const msgEl       = document.getElementById('message');
    const usageEl     = document.getElementById('usageNotice');
    const sendBtn     = document.getElementById('sendBtn');
    const responseBox = document.getElementById('responseBox');

    const today    = new Date().toISOString().slice(0,10);
    const urlDate  = new URLSearchParams(window.location.search).get('date');
    const usageKey = `usage_${today}`;
    let count      = parseInt(localStorage.getItem(usageKey) || '0', 10);

    if (msgEl && usageEl) {
      if (!urlDate || urlDate !== today) {
        msgEl.textContent = 'このURLの有効期限は切れています。QRコードを再読み込みしてください。';
        if (sendBtn) sendBtn.disabled = true;
      } else {
        usageEl.textContent = `利用回数：残り${Math.max(0,3 - count)}回`;
      }
    }

    if (!sendBtn) return;
    sendBtn.addEventListener('click', async () => {
      if (count >= 3) {
        responseBox.textContent = '⚠️ 本日の提案は上限の3回に達しました';
        return;
      }

      const companion  = document.getElementById('companion')?.value;
      const preference = document.getElementById('preference')?.value;
      const mood       = document.getElementById('mood')?.value;
      const freeInput  = document.getElementById('freeInput')?.value.trim() || '';

      if (!companion || !preference || !mood) {
        responseBox.textContent = '⚠️ 全て選択してください';
        return;
      }

      sendBtn.disabled    = true;
      sendBtn.textContent = '🍶 考え中…';
      responseBox.textContent = '🍶 ご提案を考え中です…';

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

        if (!res.ok) throw new Error(res.statusText);
        const { recommend, story, pairing } = await res.json();

        count++;
        localStorage.setItem(usageKey, count);
        if (usageEl) usageEl.textContent = `利用回数：残り${Math.max(0,3 - count)}回`;

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
        sendBtn.disabled    = false;
        sendBtn.textContent = '▶ 提案を聞く';
      }
    });
  });
})();
