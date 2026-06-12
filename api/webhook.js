import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BOT_USERNAME = "akaxhr_bot";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram bot is alive with memory");
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = String(message.from.id);
    const userName = message.from?.first_name || "User";
    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    const replyUser = message.reply_to_message?.from;
    const isReplyToBot =
      replyUser?.username?.toLowerCase() === @akaxhr_bot ||
      replyUser?.is_bot === true;

    const shouldReply =
      text.startsWith("/akash") ||
      lowerText.includes("akash") ||
      lowerText.includes("@" + akaxhr_bot) ||
      lowerText.startsWith("remember") ||
      isReplyToBot;

    if (!shouldReply) {
      return res.status(200).json({ ok: true });
    }

    if (lowerText.startsWith("remember")) {
      const memory = text
        .replace(/remember that/i, "")
        .replace(/remember/i, "")
        .trim();

      if (memory) {
        await supabase.from("memories").insert({
          user_id: userId,
          username: userName,
          memory: memory
        });
      }

      await sendTelegram(
        chatId,
        "Okay " + userName + ", I will remember: " + memory,
        message.message_id
      );

      return res.status(200).json({ ok: true });
    }

    const { data: memories } = await supabase
      .from("memories")
      .select("memory")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const memoryText =
      memories && memories.length
        ? memories.map((m) => "- " + m.memory).join("\n")
        : "No memory yet.";

    const cleanText = text
      .replace(/\/akash/gi, "")
      .replace(new RegExp("@" + BOT_USERNAME, "gi"), "")
      .replace(/akash/gi, "")
      .trim();

    const prompt =
      "You are Akash, a friendly member of this Telegram group.\n" +
      "Never call yourself an AI, chatbot, language model, or assistant unless directly asked.\n" +
      "Your name is Akash.\n" +
      "Speak casually like a normal person.\n" +
      "Keep replies short and natural.\n\n" +
      "User name: " + userName + "\n\n" +
      "User memories:\n" + memoryText + "\n\n" +
      "User message:\n" + cleanText;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    await sendTelegram(
      chatId,
      response.text || "I could not think of a reply.",
      message.message_id
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}

async function sendTelegram(chatId, text, replyTo) {
  await fetch(
    "https://api.telegram.org/bot" +
      process.env.TELEGRAM_BOT_TOKEN +
      "/sendMessage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_to_message_id: replyTo
      })
    }
  );
}
