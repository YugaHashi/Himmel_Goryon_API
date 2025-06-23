import { OpenAI } from "openai"; 
import { createClient } from "@supabase/supabase-js";

// ? OpenAI & Supabase ������
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ? ���C��API�n���h���[
export default async function handler(req, res) {
  // CORS �v���t���C�g
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    return res.status(200).end();
  }

  // POST �ȊO�͋���
  if (req.method !== "POST") 
    return res.status(405).json({ error: "Method not allowed" });

  // ���͎擾
  const { companion, mood, story, freeInput, facility } = req.body;
  if (!companion || !mood || !story || !facility)
    return res.status(400).json({ error: "Invalid input" });

  try {
    // Supabase ���烁�j���[�EFAQ�擾
    const { data: menuItems } = await supabase.from("menu_items").select("*");
    const { data: faqItems  } = await supabase.from("faq").select("*");

    // GPT�p�v�����v�g�����i����JSON�ԋp�w������j
    const prompt = `
���Ȃ��́u${facility}�v��AI�ڋq�X�^�b�t�ł��B
�ȉ��̏��Ɋ�Â��āA���������J�ȓ��{��Őڋq��Ă��쐬���Ă��������B
�S�̂�100���ȓ��A�e�Z�N�V������30?40�����x�ɗv�񂵂܂��B

�y���s�ҁz${companion}
�y�C���z${mood}
�y�b��z${story}
�y�⑫�z${freeInput || "�Ȃ�"}

�y���j���[���z
${menuItems.map(i => `�E${i.name}:${i.description}(${i.price}�~)`).join("\n")}

�yFAQ�z
${faqItems.map(f => `Q:${f.question} A:${f.answer}`).join("\n")}

? �o�͈͂ȉ���**������JSON�`���̂�**�ŕԂ��Ă��������B�O�u���E���A�E���s�E�R�[�h�u���b�N�E���߂͐�΂ɕt�����A�ȉ���JSON�̂ݏo�͂��邱�ƁB

{"recommend":"�����ɂ�������","story":"�����ɔw�i����","next":"�����Ɏ��̒��"}
`;

    // GPT�Ăяo��
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    // JSON�p�[�X�iGPT����̉����j
    const reply = JSON.parse(chat.choices[0].message.content);

    // Supabase�ɗ���ۑ�
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
