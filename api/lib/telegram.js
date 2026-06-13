import { saveMessage } from "./messages.js";

export async function sendTelegram(chatId, text, replyTo = null, chatTitle = "Bot Reply") {
  const body = {
    chat_id: chatId,
    text,
  };

  if (replyTo) {
    body.reply_to_message_id = replyTo;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const result = await res.json();

  if (!result.ok) {
    console.error("Telegram send error:", result);
    return result;
  }

  await saveMessage({
    chat_id: String(chatId),
    chat_title: chatTitle,
    user_id: "bot",
    username: "Akash",
    message_text: text,
    telegram_message_id: result.result?.message_id || null,
    reply_to_message_id: replyTo || null,
    is_bot: true,
  });

  return result;
}
