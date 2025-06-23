import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS対応ここから
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companion, preference, mood, freeInput, facility } = req.body;
  if (!companion || !preference || !mood || !facility) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('name,description,pairing');

  const prompt = `
あなたは「${facility}」のAI接客スタッフです。
以下内容をもとに、各30〜50字でJSON出力してください。

【同行者】${companion}
【好み】${preference}
【気分】${mood}
【補足】${freeInput || 'なし'}

【メニュー一覧】
${menuItems.map(i => `・${i.name}：${i.description}`).join('\n')}

{"recommend":"","story":"","pairing":""}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    const reply = JSON.parse(chat.choices[0].message.content);

    await supabase.from('chat_logs').insert([{
      facility_name: facility,
      companion, preference, mood, freeInput, gpt_response: reply
    }]);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
