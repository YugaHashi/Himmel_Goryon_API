import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders()
    });
  }

  const { companion, preference, mood, facility } = await req.json();
  if (!companion || !preference || !mood || !facility) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  // Supabase からメニュー情報を取得
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('name,description,pairing');

  const prompt = `
あなたは「${facility}」のAI接客スタッフです。
以下内容をもとに、各30〜50字でJSON出力してください。

【同行者】${companion}
【好み】${preference}
【気分】${mood}

【メニュー一覧】
${menuItems.map(i=>`・${i.name}：${i.description}`).join('\n')}

{"recommend":"","story":"","pairing":""}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3, max_tokens: 200
    });

    const reply = JSON.parse(chat.choices[0].message.content);

    await supabase.from('chat_logs').insert([{
      facility_name: facility,
      companion, preference, mood,
      gpt_response: reply
    }]);

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
