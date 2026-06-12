import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram bot is alive with memory");
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message?.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const userId = String(message.from.id);
    const userName = message.from?.first_name || "User";
    const text = message.text.trim();
     const isReplyToBot =
  message.reply_to_message?.from?.is_bot === true;

    const shouldReply =
      text.startsWith("/akash") ||
      /\bakash\b/i.test(text) ||
      text.toLowerCase().includes("remember") ||
      lowerText.includes("@akaxhr_bot".toLowerCase()) ||
      text.toLowerCase().includes("akash") ||
      isReplyToBot;
    
   

    if (!shouldReply) return res.status(200).json({ ok: true });

    // Save memory
    if (text.toLowerCase().startsWith("remember")) {
      const memory = text.replace(/remember that/i, "").replace(/remember/i, "").trim();

      if (memory) {
        await supabase.from("memories").insert({
          user_id: userId,
          username: userName,
          memory,
        });
      }

      await sendTelegram(chatId, `Okay ${userName}, I’ll remember: ${memory}`, message.message_id);
      return res.status(200).json({ ok: true });
    }

    // Get user's memories
    const { data: memories } = await supabase
      .from("memories")
      .select("memory")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const memoryText = memories?.map((m) => `- ${m.memory}`).join("\n") || "No memory yet.";

    const cleanText = text
      .replace("/akash", "")
      .replace("@akaxhr_bot", "")
      .trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `
You are Akash, a friendly member of this Telegram group.
Never call yourself an AI, chatbot, language model, or assistant unless directly asked.
Your name is Akash.
Speak casually like a normal person.
Keep replies short and natural.
you can use 😒 for being sad when someone teases.

User name: ${userName}
User memories:
${memoryText}

User message:
${cleanText}
      `,
    });

    await sendTelegram(
      chatId,
      response.text || "I couldn't think of a reply.",
      message.message_id
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}

async function sendTelegram(chatId, text, replyTo) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyTo,
    }),
  });
}
