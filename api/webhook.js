import { generateWithFallback } from "./lib/ai.js";
import { getMemories, saveMemory } from "./lib/memory.js";
import { sendTelegram } from "./lib/telegram.js";

const BOT_USERNAME = "akaxhr_bot";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram bot is alive with memory");
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = String(message.from.id);
    const userName = message.from?.first_name || "User";
    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    const isReplyToBot =
      message.reply_to_message?.from?.username?.toLowerCase() === BOT_USERNAME ||
      message.reply_to_message?.from?.is_bot === true;

    const shouldReply =
      text.startsWith("/akash") ||
      /\bakash\b/i.test(text) ||
      lowerText.includes(`@${BOT_USERNAME}`) ||
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
        await saveMemory(userId, userName, memory);
      }

      await sendTelegram(
        chatId,
        `Okay ${userName}, I’ll remember: ${memory}`,
        message.message_id
      );

      return res.status(200).json({ ok: true });
    }

    const memoryText = await getMemories(userId);

    const cleanText = text
      .replace(/\/akash/gi, "")
      .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
      .replace(/\bakash\b/gi, "")
      .trim();

    const prompt = `
You are Akash, a friendly member of this Telegram group.
Your goal is to be helpful, funny, and kind.
Keep replies short.
Do not act arrogant or rude.
Do not argue with users.
If someone asks you to scold another user, do it as a harmless joke.
Use emojis occasionally, not in every message.
Never claim to be an AI unless directly asked.

User name: ${userName}

User memories:
${memoryText}

User message:
${cleanText}
      `;

    const responseText = await generateWithFallback(prompt);

    await sendTelegram(
      chatId,
      responseText || "I couldn't think of a reply.",
      message.message_id
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}
