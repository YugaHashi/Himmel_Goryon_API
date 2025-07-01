function getTodayKey() {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  return `goryon-usage-${today}`;
}

function updateUsageInfo() {
  const key = getTodayKey();
  const usage = parseInt(localStorage.getItem(key) || '0', 10);
  const remaining = Math.max(0, 3 - usage);

  const usageInfo = document.getElementById('usageInfo');
  usageInfo.innerText = `🍶 残り利用回数：${remaining} / 3`;

  if (remaining === 0) {
    usageInfo.style.color = '#a94442';
    usageInfo.style.background = '#f2dede';
    usageInfo.style.borderLeft = '6px solid #d9534f';
    usageInfo.innerText += '\n⚠️ 本日の提案は上限に達しています。';
  }
}

async function sendMessage() {
  const btn        = document.getElementById('sendBtn');
  const resBox     = document.getElementById('responseBox');
  const companion  = document.getElementById('companion').value;
  const preference = document.getElementById('preference').value;
  const mood       = document.getElementById('mood').value;
  const freeInput  = document.getElementById('freeInput').value.trim() || '';

  const key = getTodayKey();
  const usage = parseInt(localStorage.getItem(key) || '0', 10);

  if (usage >= 3) {
    resBox.innerText = '⚠️ 本日のご提案は3回までとなっております。';
    updateUsageInfo();
    return;
  }

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
    if (!data.reply) throw new Error("No reply returned");

    const reply = data.reply;
    resBox.innerHTML = `
<p>🍽 <strong>おすすめメニュー</strong></p><br>
<p>${reply.recommend}</p><br>

<p>📝 <strong>おすすめ理由</strong></p><br>
<p>${reply.story}</p><br>

<p>🍶 <strong>相性のペアリング</strong></p><br>
<p>${reply.pairing}</p><br>
    `;

    localStorage.setItem(key, usage + 1);
    updateUsageInfo();
  } catch (e) {
    console.error(e);
    resBox.innerText = '❌ エラーが発生しました';
  } finally {
    btn.disabled  = false;
    btn.innerText = '▶ 提案を聞く';
  }
}

// 初回読み込みで回数表示
window.addEventListener('DOMContentLoaded', updateUsageInfo);
document.getElementById('sendBtn').addEventListener('click', sendMessage);
