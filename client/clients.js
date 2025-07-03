// clients.js
async function sendMessage() {
  const btn    = document.getElementById('sendBtn')
  const resBox = document.getElementById('responseBox')

  // 1日3回までの利用制限
  const today    = new Date().toISOString().slice(0,10)
  const usageKey = `usage_${today}`
  let count      = parseInt(localStorage.getItem(usageKey) || '0', 10)
  if (count >= 3) {
    resBox.innerText = '⚠️ 本日の提案は上限の3回に達しました'
    return
  }

  const companion  = document.getElementById('companion').value
  const preference = document.getElementById('preference').value
  const mood       = document.getElementById('mood').value
  const freeInput  = document.getElementById('freeInput').value.trim()

  if (!companion || !preference || !mood) {
    resBox.innerText = '⚠️ 全て選択してください'
    return
  }

  btn.disabled  = true
  btn.innerText = '🍶 考え中…'
  resBox.innerText = '🍶 ご提案を考え中です…'

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
    })
    const data = await resp.json()
    if (!data.reply) throw new Error('No reply returned')

    // カウントを更新
    count += 1
    localStorage.setItem(usageKey, count)

    const r = data.reply
    resBox.innerHTML = `
      <p>🍽 <strong>おすすめメニュー</strong></p>
      <p>${r.recommend}</p>
      <p>📝 <strong>おすすめ理由</strong></p>
      <p>${r.story}</p>
      <p>🍶 <strong>相性のペアリング</strong></p>
      <p>${r.pairing}</p>
    `

    // 送信→表示の橋渡し
    localStorage.setItem('goryon_lastResult', resBox.innerHTML)
  } catch (e) {
    console.error(e)
    resBox.innerText = '❌ エラーが発生しました'
  } finally {
    btn.disabled  = false
    btn.innerText = '▶ 提案を聞く'
  }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage)
