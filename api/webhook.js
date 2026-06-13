import { generateWithFallback } from "./lib/ai.js";
import { getUserHistory, saveUserHistory } from "./lib/memory.js";
import { sendTelegram } from "./lib/telegram.js";
import { saveMessage } from "./lib/messages.js";
import { getDisplayName } from "./lib/aliases.js";

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
    const displayName = await getDisplayName(userId, userName);
    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    await saveMessage({
  chat_id: String(chatId),
  chat_title:
    message.chat.title ||
    message.chat.first_name ||
    message.chat.username ||
    "Private Chat",
  chat_type: message.chat.type,
  user_id: userId,
  username: displayName,
  message_text: text,
  telegram_message_id: message.message_id,
  reply_to_message_id: message.reply_to_message?.message_id || null,
  is_bot: false,
});
    await saveUserHistory(userId, userName, "user", text);

    const isReplyToBot =
      message.reply_to_message?.from?.username?.toLowerCase() === BOT_USERNAME ||
      message.reply_to_message?.from?.is_bot === true;

    const isPrivateChat = message.chat.type === "private";

const shouldReply =
  isPrivateChat ||
  text.startsWith("/akash") ||
  /\bakash\b/i.test(text) ||
  lowerText.includes(`@${BOT_USERNAME}`) ||
  lowerText.startsWith("remember") ||
  isReplyToBot;
    if (!shouldReply) {
      return res.status(200).json({ ok: true });
    }

    

    const memoryText = await getUserHistory(userId);

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

User name: ${displayName}

Recent conversation with this user:
${memoryText}

User message:
${cleanText}
      `;

    const responseText = await generateWithFallback(prompt);

    const finalReply = responseText || "I couldn't think of a reply.";

await sendTelegram(chatId, finalReply, message.message_id);

await saveUserHistory(userId, displayName, "user", text);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}
