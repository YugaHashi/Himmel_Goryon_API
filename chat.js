import { OpenAI } from "openai"; 
import { createClient } from "@supabase/supabase-js";

// ? OpenAI & Supabase 初期化
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ? メインAPIハンドラー
export default async function handler(req, res) {
  // CORS プリフライト
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    return res.status(200).end();
  }

  // POST 以外は拒否
  if (req.method !== "POST") 
    return res.status(405).json({ error: "Method not allowed" });

  // 入力取得
  const { companion, mood, story, freeInput, facility } = req.body;
  if (!companion || !mood || !story || !facility)
    return res.status(400).json({ error: "Invalid input" });

  try {
    // Supabase からメニュー・FAQ取得
    const { data: menuItems } = await supabase.from("menu_items").select("*");
    const { data: faqItems  } = await supabase.from("faq").select("*");

    // GPT用プロンプト生成（安定JSON返却指示入り）
    const prompt = `
あなたは「${facility}」のAI接客スタッフです。
以下の情報に基づいて、温かく丁寧な日本語で接客提案を作成してください。
全体で100字以内、各セクション約30?40字程度に要約します。

【同行者】${companion}
【気分】${mood}
【話題】${story}
【補足】${freeInput || "なし"}

【メニュー情報】
${menuItems.map(i => `・${i.name}:${i.description}(${i.price}円)`).join("\n")}

【FAQ】
${faqItems.map(f => `Q:${f.question} A:${f.answer}`).join("\n")}

? 出力は以下の**純粋なJSON形式のみ**で返してください。前置き・挨拶・改行・コードブロック・注釈は絶対に付けず、以下のJSONのみ出力すること。

{"recommend":"ここにおすすめ","story":"ここに背景説明","next":"ここに次の提案"}
`;

    // GPT呼び出し
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    // JSONパース（GPTからの応答）
    const reply = JSON.parse(chat.choices[0].message.content);

    // Supabaseに履歴保存
    await supabase.from("chat_logs").insert([{
      facility_name: facility,
      companion, mood, story, freeInput,
      gpt_response: reply
    }]);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ reply });

  } catch(err) {
    console.error("? Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
