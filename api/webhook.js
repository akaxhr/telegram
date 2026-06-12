import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram bot is alive");
  }

  try {
    const update = req.body;

    const message = update.message;
    if (!message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userName = message.from?.first_name || "User";
    const text = message.text;

    const shouldReply =
      text.startsWith("/ask") ||
      text.includes("@YOUR_BOT_USERNAME");

    if (!shouldReply) {
      return res.status(200).json({ ok: true });
    }

    const cleanText = text
      .replace("/ask", "")
      .replace("@akaxhr_bot", "")
      .trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `You are a friendly Telegram group AI bot. Reply casually and shortly.
User name: ${userName}
Message: ${cleanText}`,
    });

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: response.text || "I couldn't think of a reply.",
        reply_to_message_id: message.message_id,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}
