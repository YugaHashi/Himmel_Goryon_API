// api/chat.js 
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companion, preference, mood, freeInput, facility } = req.body;
  if (!companion || !preference || !mood || !facility) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { data: menuItems, error: sbError } = await supabase
    .from('menu_items')
    .select('name,description,pairing');
  if (sbError) {
    console.error('Supabase error:', sbError);
    return res.status(500).json({ error: 'Database fetch error' });
  }

  const prompt = `
以下の情報をもとに、お客様に最適な料理をおすすめしてください。
【同行者】${companion}
【好み】${preference}
【気分】${mood}
【補足】${freeInput || 'なし'}

【メニュー一覧】
${menuItems.map(i => `・${i.name}：${i.description}`).join('\n')}

以下のJSON形式のみで返答してください（装飾・マークダウン・改行なし）：
{"recommend": "おすすめ料理", "story": "おすすめ理由", "pairing": "相性の良いペアリング"}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `あなたは「${facility}」のAI接客スタッフです。` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: "json" // ✅ JSON形式を強制
    });

    const reply = chat.choices[0].message.function_call?.arguments || chat.choices[0].message.content;
    const parsed = typeof reply === 'string' ? JSON.parse(reply) : reply;

    await supabase.from('chat_logs').insert([{
      facility_name: facility,
      companion,
      preference,
      mood,
      freeInput,
      gpt_response: parsed
    }]);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ reply: parsed });
  } catch (err) {
    console.error('Handler error:', err.message, err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
