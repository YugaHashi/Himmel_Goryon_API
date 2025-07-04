// api/chat.js
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORSプリフライト対応
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // POST以外を拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companion, preference, mood, freeInput, facility } = req.body;
  if (!companion || !preference || !mood || !facility) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // メニュー一覧を取得
  const { data: menuItems, error: sbError } = await supabase
    .from('menu_items')
    .select('name,description,pairing');

  if (sbError) {
    return res.status(500).json({ error: 'Database fetch error' });
  }

  // プロンプト作成
  const prompt = `以下の情報をもとに、お客様に最適な料理をおすすめしてください。
【同行者】${companion}
【好み】${preference}
【気分】${mood}
【補足】${freeInput || 'なし'}

【メニュー一覧】
${menuItems.map(i => `・${i.name}：${i.description}`).join('\n')}

以下のJSON形式で返答してください：
{"recommend": "おすすめ料理", "story": "おすすめ理由", "pairing": "相性の良いペアリング"}`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `あなたは「${facility}」のAI接客スタッフです。` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const reply = chat.choices[0].message.content;
    const parsed = typeof reply === 'string' ? JSON.parse(reply) : reply;

    // ログをSupabaseに保存
    await supabase
      .from('chat_logs')
      .insert([{
        facility_name: facility,
        companion,
        preference,
        mood,
        freeInput,
        gpt_response: parsed
      }]);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
